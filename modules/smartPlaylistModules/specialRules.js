"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));
const spotifyClient = require(path.join(customModulePath, "spotifyClient.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const helperFunctions = require(path.join(smartPlaylistModulesPath, "helperFunctions.js"));
const rules = require(path.join(smartPlaylistModulesPath, "rules.js"));

// Default Constant Values
const artistGenreRetrievalLimit = 50;
const audioFeaturesRetrievalLimit = 100;

// Special Rules Logic
exports.getPlaylistSpecialRuleFlags = function(inputRules)
{
    const flags = new Set();
    if (!Array.isArray(inputRules) || inputRules.length <= 0)
    {
        return flags;
    }

    // Loop through every rule to check if there are any special cases to account for
    for (const inputRule of inputRules)
    {
        const inputRuleFunction = inputRule.function;
        const isGenreRule = inputRuleFunction === rules.ruleByGenre;

        if (isGenreRule)
        {
            flags.add("genre");
        }

        const isAudioFeaturesRule =
            inputRuleFunction === rules.ruleByBeatsPerMinute ||
            inputRuleFunction === rules.ruleByDecibels ||
            inputRuleFunction === rules.ruleByAcousticness ||
            inputRuleFunction === rules.ruleByDanceability ||
            inputRuleFunction === rules.ruleByEnergy ||
            inputRuleFunction === rules.ruleByInstrumentalness ||
            inputRuleFunction === rules.ruleByLiveness ||
            inputRuleFunction === rules.ruleBySpeechiness ||
            inputRuleFunction === rules.ruleByValence;

        if (isAudioFeaturesRule)
        {
            flags.add("audioFeatures");
        }
    }

    return flags;
};

exports.getArtistIdToGenreMap = async function(req, res, savedTracks, existingArtistIdToGenresMap)
{
    try
    {
        // First, get a set of all unique artist IDs that do not exist in our map already
        const unmappedArtistIds = new Set();
        for (const savedTrack of savedTracks)
        {
            // If we cannot find data about a track or artists for a song, just skip the track
            if (!savedTrack || !savedTrack.track || !savedTrack.track.artists)
            {
                continue;
            }

            for (const artist of savedTrack.track.artists)
            {
                // Look to see that the ID is present and valid and does not already exist in our map
                // If it does exist in the map, we can safely skip it (since we already know that artist's genres)
                if (artist.id && !existingArtistIdToGenresMap.has(artist.id))
                {
                    unmappedArtistIds.add(artist.id);
                }
            }
        }

        // If it turns out all of the artists we have are already mapped, then we can just return the existing map
        if (unmappedArtistIds.size <= 0)
        {
            return Promise.resolve(existingArtistIdToGenresMap);
        }

        // With a set of unique unmapped artist IDs, group them into chunks to get genre data for artists in batches
        const artistIds = Array.from(unmappedArtistIds);
        const artistIdChunks = helperFunctions.getArrayChunks(artistIds, artistGenreRetrievalLimit);
        const artistIdToGenresMap = new Map();

        for (const artistIdChunk of artistIdChunks)
        {
            // Call out to Spotify to get genre information for not already mapped artist
            req.query.artistIds = artistIdChunk;
            const response = await spotifyClient.getMultipleArtists(req, res);
            if (!response || !response.artists)
            {
                throw new Error("Failed to get valid artists response data");
            }

            // Loop through all of the artists and their respective genres (likely multiple)
            // The result will be a set of unique non-duplicated genres
            for (const artist of response.artists)
            {
                if (!artist)
                {
                    continue;
                }

                const genresForArtist = [];
                for (const artistGenre of artist.genres)
                {
                    if (!artistGenre)
                    {
                        continue;
                    }

                    // Collect one genre at a time for the artist into an array
                    const upperCaseArtistGenre = artistGenre.toUpperCase();
                    genresForArtist.push(upperCaseArtistGenre);
                }

                // Add the genres array into the map corresponding to the artist ID
                artistIdToGenresMap.set(artist.id, genresForArtist);
            }
        }

        // Finally, take the artist IDs to genres we found with this run
        // Then add them to the existing map to return
        const updatedArtistIdToGenreMap = new Map([...existingArtistIdToGenresMap, ...artistIdToGenresMap]);
        return Promise.resolve(updatedArtistIdToGenreMap);
    }
    catch (error)
    {
        // If there is a problem with getting artist data, then a user's playlist request related to genre data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to build artist to genres map: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getTrackIdToAudioFeaturesMap = async function(req, res, savedTracks, existingTrackIdToAudioFeaturesMap)
{
    try
    {
        // First, get a set of all unique track IDs that do not exist in our map already
        const unmappedTrackIds = new Set();
        for (const savedTrack of savedTracks)
        {
            // If we cannot find data about a track or ID, just skip the track
            if (!savedTrack || !savedTrack.track || !savedTrack.track.id)
            {
                continue;
            }

            // Look to see that the ID is present and valid and does not already exist in our map
            // If it does exist in the map, we can safely skip it (since we already know that song's audio features)
            const trackId = savedTrack.track.id;
            if (trackId && !existingTrackIdToAudioFeaturesMap.has(trackId))
            {
                unmappedTrackIds.add(trackId);
            }
        }

        // If it turns out all of the tracks we have are already mapped, then we can just return the existing map
        if (unmappedTrackIds.size <= 0)
        {
            return Promise.resolve(existingTrackIdToAudioFeaturesMap);
        }

        // With a set of unique unmapped track IDs, group them into chunks to get audio feature data for tracks in batches
        const trackIds = Array.from(unmappedTrackIds);
        const trackIdChunks = helperFunctions.getArrayChunks(trackIds, audioFeaturesRetrievalLimit);
        const trackIdToAudioFeaturesMap = new Map();

        for (const trackIdChunk of trackIdChunks)
        {
            // Call out to Spotify to get audio feature information for not already mapped tracks
            req.query.trackIds = trackIdChunk;
            const response = await spotifyClient.getAudioFeatures(req, res);
            if (!response || !response.audioFeatures)
            {
                throw new Error("Failed to get valid audio features response data");
            }

            // Loop through all of the audio feature responses and store in the map (one audio feature object for each track)
            for (const audioFeatures of response.audioFeatures)
            {
                if (!audioFeatures)
                {
                    continue;
                }

                // Add the audio features object into the map corresponding to the track ID
                trackIdToAudioFeaturesMap.set(audioFeatures.id, audioFeatures);
            }
        }

        // Finally, take the track IDs to audio features we found with this run
        // Then add them to the existing map to return
        const updatedTrackIdToAudioFeaturesMap = new Map([...existingTrackIdToAudioFeaturesMap, ...trackIdToAudioFeaturesMap]);
        return Promise.resolve(updatedTrackIdToAudioFeaturesMap);
    }
    catch (error)
    {
        // If there is a problem with getting audio feature data,
        // Then a user's playlist request related to audio feature data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to build track to audio features map: ${error.message}`);
        return Promise.reject(error);
    }
};
