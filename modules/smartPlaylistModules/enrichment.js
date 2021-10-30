"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));

// Enrichment Logic
exports.enrichTracksWithGenres = function(savedTracks, artistIdToGenresMap)
{
    try
    {
        for (const savedTrack of savedTracks)
        {
            // Genre is only defined within Spotify on the artist object
            // Convert a track's artists to their artist IDs to begin the process
            const artistIds = dataRetrieval
                .getArtistsFromSavedTrack(savedTrack)
                .map(dataRetrieval.getArtistIdFromArtist);

            // For every artist ID, check the map for artist IDs to genres
            let genresForTrack = [];

            for (const artistId of artistIds)
            {
                if (artistIdToGenresMap.has(artistId))
                {
                    // We already have a mapping from this artist ID to genres, so use those genres
                    const mappedGenresForArtist = artistIdToGenresMap.get(artistId);
                    genresForTrack = genresForTrack.concat(mappedGenresForArtist);
                }
            }

            // De-duplicate all the genres already found from artists for this track
            const genresForTrackSet = new Set(genresForTrack);

            // Finally, set the genres onto the track object
            // If there are no genres found, this will set an empty array in this property
            const uniqueGenresForTrack = Array.from(genresForTrackSet);
            savedTrack.track.genres = uniqueGenresForTrack;
        }

        // When finished adding genres to the tracks, return the modified tracks
        return Promise.resolve(savedTracks);
    }
    catch (error)
    {
        // If there is a problem with the enrichment, then a user's request related to genre data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to enrich tracks with genres: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.enrichTracksWithAudioFeatures = function(savedTracks, trackIdToAudioFeaturesMap)
{
    try
    {
        for (const savedTrack of savedTracks)
        {
            // Check the mapping for a track ID to its corresponding audio features
            // If we do not have audio features for this track, simply use an empty object
            let audioFeatures = {};
            const trackId = savedTrack.track.id;
            if (trackIdToAudioFeaturesMap.has(trackId))
            {
                audioFeatures = trackIdToAudioFeaturesMap.get(trackId);
            }

            // Finally, set the audio features onto the track object
            savedTrack.track.audio_features = audioFeatures;
        }

        // When finished adding audio features to the tracks, return the modified tracks
        return Promise.resolve(savedTracks);
    }
    catch (error)
    {
        // If there is a problem with the enrichment, then a user's request related to audio features data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to enrich tracks with audio features: ${error.message}`);
        return Promise.reject(error);
    }
};
