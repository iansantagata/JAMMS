"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const spotifyClient = require(path.join(customModulePath, "spotifyClient.js"));
const logger = require(path.join(customModulePath, "logger.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const helperFunctions = require(path.join(smartPlaylistModulesPath, "helperFunctions.js"));
const enrichment = require(path.join(smartPlaylistModulesPath, "enrichment.js"));
const specialRules = require(path.join(smartPlaylistModulesPath, "specialRules.js"));

// Default Constant Values
const playlistNamePrefix = "JAMMS: ";
const playlistDescriptionPrefix = "Uses only songs I have liked. ";
const playlistDescriptionLimitPrefix = "Limited to ";
const playlistDescriptionOrderPrefix = "Sorted by ";
const playlistDescriptionIn = "in";
const playlistDescriptionOrder = "order";
const playlistDescriptionSpace = " ";
const playlistDescriptionPeriod = ".";

const playlistPreviewLimit = 25;
const tracksPerPageDefault = 50;
const maximumPlaylistSongLimit = 10000;
const maximumRecursionLimit = 3;

const artistGenreRetrievalLimit = 50;
const trackAddPlaylistLimit = 100;

const secondsToMsecConversion = 1000;
const minutesToSecondsConversion = 60;
const hoursToMinutesConversion = 60;

// Smart Playlist Logic
exports.createSmartPlaylistPage = function(req, res, next)
{
    try
    {
        // Simply show the user the page to create a new smart playlist
        res.location("/createSmartPlaylist");
        res.render("createSmartPlaylist");
    }
    catch (error)
    {
        logger.logError(`Failed to get create smart playlist page: ${error.message}`);
        next(error);
    }
};

exports.getSmartPlaylistPreview = async function(req, res, next)
{
    try
    {
        // Set that this is to be a playlist preview (which will short circuit some extra work not needed for a preview)
        req.body.isPlaylistPreview = true;

        const smartPlaylistData = await getSmartPlaylistData(req, res);
        const playlistPreviewData = smartPlaylistData.trackData;

        // Send the preview data back to the caller without reloading the page
        res.set("Content-Type", "application/json");
        res.send(playlistPreviewData);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist preview: ${error.message}`);
        next(error);
    }
};

exports.createSmartPlaylist = async function(req, res, next)
{
    try
    {
        // Get track data and information needed to create the smart playlist
        const smartPlaylistData = await getSmartPlaylistData(req, res);
        if (!smartPlaylistData ||
            !smartPlaylistData.trackData ||
            !Array.isArray(smartPlaylistData.trackData) ||
            smartPlaylistData.trackData.length <= 0)
        {
            throw new Error("Failed to get valid smart playlist data");
        }

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);

        // For visibility purposes, prepend the name of the smart playlist with the app name
        req.body.playlistName = playlistNamePrefix + req.body.playlistName;
        req.body.playlistDescription = getPlaylistDescription(smartPlaylistData.limitData, smartPlaylistData.orderData);
        const createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        const playlistId = createPlaylistResponse.id;
        const trackUris = smartPlaylistData.trackData.map(getUriFromSavedTrack);
        const trackUriChunks = helperFunctions.getArrayChunks(trackUris, trackAddPlaylistLimit);
        req.body.playlistId = playlistId;

        // Add songs to the playlist in batches since there is a limit to how many can be added at once
        for (const trackUriChunk of trackUriChunks)
        {
            req.body.trackUris = trackUriChunk;
            await spotifyClient.addTracksToPlaylist(req, res);
        }

        // Finally, we want to show the user info about their new playlist, so retrieve that data after songs were inserted
        req.query.playlistId = playlistId;
        const getPlaylistResponse = await spotifyClient.getSinglePlaylist(req, res);

        const playlistData = {
            deleted: false,
            followersCount: getPlaylistResponse.followers.total,
            images: getPlaylistResponse.images,
            isCollaborative: getPlaylistResponse.collaborative,
            isPublic: getPlaylistResponse.public,
            playlistDescription: getPlaylistResponse.description,
            playlistId: getPlaylistResponse.id,
            playlistName: getPlaylistResponse.name,
            trackCount: getPlaylistResponse.tracks.total
        };

        // Shove the playlist response data onto the playlist page for the user to interact with
        res.location("/playlist");
        res.render("viewPlaylist", playlistData);
    }
    catch (error)
    {
        logger.logError(`Failed to create smart playlist: ${error.message}`);
        next(error);
    }
};

// Local Helper Functions
async function getSmartPlaylistData(req, res)
{
    try
    {
        // First, process all of the rules and optional settings from the request
        const isPlaylistPreview = Boolean(req.body.isPlaylistPreview);
        const playlistLimitData = getPlaylistLimits(req);
        const playlistOrderData = getPlaylistOrdering(req);
        const playlistRules = getPlaylistRules(req);

        // Make sure that any special rules are extracted and any additional structures are setup
        // This is done so that if a track does not have the data we need,
        // Then the app can retrieve that data and enrich the track with the data manually
        const playlistSpecialRuleFlags = specialRules.getPlaylistSpecialRuleFlags(playlistRules);
        let artistIdToGenresMap = new Map();

        // Keep track of the tracks to be in the playlist and the order of them as well
        const tracksInPlaylist = [];
        let trackOrderingInPlaylist = [];
        let timeOfTracksInPlaylistInMsec = 0;
        let canRetrieveMoreBatches = true;

        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = tracksPerPageDefault; // Maximum value of tracks to retrieve per page

        // Loop over all songs in the library in batches
        while (canRetrieveMoreBatches)
        {
            // Get all the tracks in this batch
            const getAllTracksBatchedResponse = await spotifyClient.getAllTracks(req, res);

            // Get data on the tracks processed
            const tracksProcessed = getAllTracksBatchedResponse.offset + getAllTracksBatchedResponse.limit;
            const totalTracks = getAllTracksBatchedResponse.total;
            let tracksInBatch = getAllTracksBatchedResponse.items;

            // Increment the page number to retrieve the next batch of tracks when ready
            req.query.pageNumber++;

            // If there are no more tracks to retrieve from the library after these ones, mark that so we do not continue endlessly
            if (tracksProcessed >= totalTracks)
            {
                canRetrieveMoreBatches = false;
            }

            // Handle any special rules required before track processing begins
            if (playlistSpecialRuleFlags.has("genre"))
            {
                artistIdToGenresMap = await specialRules.getArtistIdToGenreMap(req, res, tracksInBatch, artistIdToGenresMap);
                tracksInBatch = await enrichment.enrichTrackWithGenres(tracksInBatch, artistIdToGenresMap);
            }

            // Process each track in the batch
            for (const trackInBatch of tracksInBatch)
            {
                // Ensure that this track should go into the playlist based on the rules
                let trackFollowsAllRules = true;
                for (const playlistRule of playlistRules)
                {
                    if (!playlistRule.function(trackInBatch, playlistRule.data, playlistRule.operator))
                    {
                        trackFollowsAllRules = false;
                        break;
                    }
                }

                // If the track breaks even one of the rules, skip it and move to the next track to check
                if (!trackFollowsAllRules)
                {
                    continue;
                }

                // Put the track in the list of tracks to go in the playlist and keep a running tally of how long the playlist is
                tracksInPlaylist.push(trackInBatch);
                const lastTrackAddedIndex = tracksInPlaylist.length - 1;
                timeOfTracksInPlaylistInMsec += getDurationFromSavedTrack(trackInBatch);

                // Figure out where this track should be ordered in the playlist
                if (playlistOrderData.enabled)
                {
                    trackOrderingInPlaylist = getOrderForTracks(lastTrackAddedIndex, tracksInPlaylist, trackOrderingInPlaylist, playlistOrderData.comparisonFunction);
                }
                else
                {
                    // If order does not matter, just add the track to the end of the list
                    trackOrderingInPlaylist.push(lastTrackAddedIndex);
                }

                // If this is a playlist preview, we want to get the first set of songs that satisfy the requirements quickly
                // We want to be conscious of processing time, so we do not need to get all the songs in the library to create the playlist yet
                // Thus, we can just stop grabbing new batches and processing tracks once we have reached the desired limit
                if (isPlaylistPreview && tracksInPlaylist.length >= playlistPreviewLimit)
                {
                    // Will break out of the batch processing loop
                    canRetrieveMoreBatches = false;

                    // Breaks out of the track processing loop for a single batch
                    break;
                }
            }
        }

        // Filter the tracks in the playlist based on number of songs limit (if applicable)
        while (playlistLimitData.enabled && playlistLimitData.type === "songs" && trackOrderingInPlaylist.length > playlistLimitData.value)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            const trackIndexToRemoveBySongLimit = trackOrderingInPlaylist.pop();
            const trackToRemoveBySongLimit = tracksInPlaylist[trackIndexToRemoveBySongLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveBySongLimit);
            tracksInPlaylist[trackIndexToRemoveBySongLimit] = null;
        }

        // Filter the tracks in the playlist based on total time limit (if applicable)
        while (playlistLimitData.enabled && playlistLimitData.type === "milliseconds" && timeOfTracksInPlaylistInMsec > playlistLimitData.value)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            const trackIndexToRemoveByTimeLimit = trackOrderingInPlaylist.pop();
            const trackToRemoveByTimeLimit = tracksInPlaylist[trackIndexToRemoveByTimeLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveByTimeLimit);
            tracksInPlaylist[trackIndexToRemoveByTimeLimit] = null;
        }

        // Once we have an ordered list of all the tracks to use, shuffle around the track data to be in that order
        const orderedTracksInPlaylist = [];
        for (const trackIndex of trackOrderingInPlaylist)
        {
            orderedTracksInPlaylist.push(tracksInPlaylist[trackIndex]);
        }

        const smartPlaylistData = {
            limitData: playlistLimitData,
            orderData: playlistOrderData,
            trackData: orderedTracksInPlaylist
        };

        return Promise.resolve(smartPlaylistData);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

function getPlaylistDescription(playlistLimitData, playlistOrderData)
{
    let playlistDescription = playlistDescriptionPrefix;

    if (playlistLimitData.enabled)
    {
        playlistDescription += playlistDescriptionLimitPrefix + playlistDescriptionSpace +
            playlistLimitData.value + playlistDescriptionSpace +
            playlistLimitData.userSpecifiedType + playlistDescriptionPeriod + playlistDescriptionSpace;
    }

    if (playlistOrderData.enabled)
    {
        playlistDescription += playlistDescriptionOrderPrefix + playlistDescriptionSpace +
            playlistOrderData.field + playlistDescriptionSpace +
            playlistDescriptionIn + playlistDescriptionSpace +
            playlistOrderData.direction + playlistDescriptionSpace +
            playlistDescriptionOrder + playlistDescriptionPeriod + playlistDescriptionSpace;
    }

    return playlistDescription;
}
