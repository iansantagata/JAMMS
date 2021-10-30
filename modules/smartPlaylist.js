"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
const spotifyClient = require(path.join(customModulePath, "spotifyClient.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = path.join(__dirname, "smartPlaylistModules");
const enrichment = require(path.join(smartPlaylistModulesPath, "enrichment.js"));
const specialRules = require(path.join(smartPlaylistModulesPath, "specialRules.js"));
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));
const limits = require(path.join(smartPlaylistModulesPath, "limits.js"));
const ordering = require(path.join(smartPlaylistModulesPath, "ordering.js"));
const rules = require(path.join(smartPlaylistModulesPath, "rules.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const chunk = require(path.join(utilityModulesPath, "chunk.js"));
const logger = require(path.join(utilityModulesPath, "logger.js"));
const errorUtils = require(path.join(utilityModulesPath, "errorUtils.js"));

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
const trackAddPlaylistLimit = 100;

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

exports.getSmartPlaylistPreview = async function(req, res)
{
    try
    {
        // First, process all of the rules and optional settings from the request
        // Set that this is to be a playlist preview (which will short circuit some extra work not needed for a preview)
        const isPlaylistPreview = true;
        const playlistRules = rules.getPlaylistRules(req);
        const playlistOrderData = ordering.getPlaylistOrdering(req);
        const playlistLimitData = limits.getPlaylistLimits(req);

        const smartPlaylistSettings = {
            isPlaylistPreview: isPlaylistPreview,
            playlistLimitData: playlistLimitData,
            playlistOrderData: playlistOrderData,
            playlistRules: playlistRules
        };

        const smartPlaylistPreviewTracks = await getSmartPlaylistTracks(req, res, smartPlaylistSettings);

        // Send the preview data back to the caller without reloading the page
        res.set("Content-Type", "application/json");
        res.send(smartPlaylistPreviewTracks);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist preview: ${error.message}`);
        errorUtils.handleAjaxError(res);
    }
};

exports.createSmartPlaylist = async function(req, res, next)
{
    try
    {
        // First, process all of the rules and optional settings from the request
        const isPlaylistPreview = false;
        const playlistRules = rules.getPlaylistRules(req);
        const playlistOrderData = ordering.getPlaylistOrdering(req);
        const playlistLimitData = limits.getPlaylistLimits(req);

        const smartPlaylistSettings = {
            isPlaylistPreview: isPlaylistPreview,
            playlistLimitData: playlistLimitData,
            playlistOrderData: playlistOrderData,
            playlistRules: playlistRules
        };

        // Get track data and information needed to create the smart playlist
        const smartPlaylistTracks = await getSmartPlaylistTracks(req, res, smartPlaylistSettings);
        if (!smartPlaylistTracks ||
            !Array.isArray(smartPlaylistTracks) ||
            smartPlaylistTracks.length <= 0)
        {
            throw new Error("Failed to get valid smart playlist data");
        }

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);

        // For visibility purposes, prepend the name of the smart playlist with the app name
        req.body.playlistName = playlistNamePrefix + req.body.playlistName;
        req.body.playlistDescription = getPlaylistDescription(playlistLimitData, playlistOrderData);
        const createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        const playlistId = createPlaylistResponse.id;
        const trackUris = smartPlaylistTracks.map(dataRetrieval.getUriFromSavedTrack);
        const trackUriChunks = chunk.getArrayChunks(trackUris, trackAddPlaylistLimit);
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
async function getRuleFollowingSmartPlaylistTracks(req, res, isPlaylistPreview, playlistRules)
{
    try
    {
        // Make sure that any special rules are extracted and any additional structures are setup
        // This is done so that if a track does not have the data we need,
        // Then the app can retrieve that data and enrich the track with the data manually
        const playlistSpecialRuleFlags = specialRules.getPlaylistSpecialRuleFlags(playlistRules);
        let artistIdToGenresMap = new Map();
        let trackIdToAudioFeaturesMap = new Map();

        // Keep track of the tracks to be in the playlist and the order of them as well
        const savedTracksInPlaylist = [];
        let canRetrieveMoreBatches = true;

        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = tracksPerPageDefault; // Maximum value of tracks to retrieve per page

        // Loop over all songs in the library in batches
        while (canRetrieveMoreBatches)
        {
            // Get all the tracks in this batch
            const allTracksBatchedResponse = await spotifyClient.getAllTracks(req, res);

            // Get data on the tracks processed
            const tracksProcessed = allTracksBatchedResponse.offset + allTracksBatchedResponse.limit;
            const totalTracks = allTracksBatchedResponse.total;
            let savedTracksInBatch = allTracksBatchedResponse.items;

            // Handle any special rules required before track processing begins
            if (playlistSpecialRuleFlags.has("genre"))
            {
                artistIdToGenresMap = await specialRules.getArtistIdToGenreMap(req, res, savedTracksInBatch, artistIdToGenresMap);
                savedTracksInBatch = await enrichment.enrichTracksWithGenres(savedTracksInBatch, artistIdToGenresMap);
            }

            if (playlistSpecialRuleFlags.has("audioFeatures"))
            {
                trackIdToAudioFeaturesMap = await specialRules.getTrackIdToAudioFeaturesMap(
                    req,
                    res,
                    savedTracksInBatch,
                    trackIdToAudioFeaturesMap
                );

                savedTracksInBatch = await enrichment.enrichTracksWithAudioFeatures(savedTracksInBatch, trackIdToAudioFeaturesMap);
            }

            // Process each track in the batch
            for (const savedTrackInBatch of savedTracksInBatch)
            {
                // Ensure that this track should go into the playlist based on the rules
                // If the track breaks even one of the rules, skip it and move to the next track to check
                const trackFollowsAllRules = doesTrackBelongInPlaylist(savedTrackInBatch, playlistRules);
                if (!trackFollowsAllRules)
                {
                    continue;
                }

                // Put the target track that follows the rules in the list of tracks to go in the playlist
                savedTracksInPlaylist.push(savedTrackInBatch);

                // If this is a playlist preview, we want to get the first set of songs that satisfy the requirements quickly
                // We want to be conscious of processing time, so we do not need to get all the songs in the library to create the playlist yet
                // Thus, we can just stop grabbing new batches and processing tracks once we have reached the desired limit
                if (isPlaylistPreview && savedTracksInPlaylist.length >= playlistPreviewLimit)
                {
                    // Will break out of the batch processing loop
                    canRetrieveMoreBatches = false;

                    // Breaks out of the track processing loop for this batch
                    break;
                }
            }

            // If there are no more tracks to retrieve from the library after these ones, mark that so we do not continue endlessly
            if (tracksProcessed >= totalTracks)
            {
                canRetrieveMoreBatches = false;
            }

            // Increment the page number to retrieve the next batch of tracks (if applicable)
            req.query.pageNumber++;
        }

        return Promise.resolve(savedTracksInPlaylist);
    }
    catch (error)
    {
        logger.logError(`Failed to get rule following smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

function getOrderedSmartPlaylistTracks(playlistOrderData, savedTracksInPlaylist)
{
    try
    {
        // If order does not matter, simply return the saved tracks
        if (!playlistOrderData.enabled)
        {
            return Promise.resolve(savedTracksInPlaylist);
        }

        // Order the tracks by looping through each of them and putting them into a new array
        let orderedSavedTracksInPlaylist = [];
        for (const savedTrackInPlaylist of savedTracksInPlaylist)
        {
            // Figure out where this track should be ordered in the playlist and put it there
            orderedSavedTracksInPlaylist = ordering.putTrackIntoOrderedTracks(
                savedTrackInPlaylist,
                orderedSavedTracksInPlaylist,
                playlistOrderData.comparisonFunction
            );
        }

        return Promise.resolve(orderedSavedTracksInPlaylist);
    }
    catch (error)
    {
        logger.logError(`Failed to get ordered smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

function getFilteredSmartPlaylistTracks(playlistLimitData, savedTracksInPlaylist)
{
    try
    {
        // If limiting is not enabled, simply return the saved tracks
        if (!playlistLimitData.enabled)
        {
            return Promise.resolve(savedTracksInPlaylist);
        }

        // Determine which filtering function should be used to filter the tracks
        let filteringFunction = () => {};
        switch (playlistLimitData.type)
        {
            case "songs":
                filteringFunction = limits.getPlaylistTracksLimitedBySongs;
                break;

            case "milliseconds":
                filteringFunction = limits.getPlaylistTracksLimitedByMsec;
                break;

            default:
                // If there is an unknown filter, this function will simply return the saved tracks without filtering them
                filteringFunction = limits.getPlaylistTracksLimitedByUnknown;
                break;
        }

        // Filter the tracks in the playlist using the specific filtering function
        const filteredSavedTracksInPlaylist = filteringFunction(savedTracksInPlaylist, playlistLimitData.value);

        return Promise.resolve(filteredSavedTracksInPlaylist);
    }
    catch (error)
    {
        logger.logError(`Failed to get filtered smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

async function getSmartPlaylistTracks(req, res, smartPlaylistSettings)
{
    try
    {
        // First, get all of the tracks that follow all the smart playlist rules
        const smartPlaylistSavedTracks = await getRuleFollowingSmartPlaylistTracks(
            req,
            res,
            smartPlaylistSettings.isPlaylistPreview,
            smartPlaylistSettings.playlistRules
        );

        // Next, order the saved tracks that belong in the playlist
        const orderedSmartPlaylistSavedTracks = await getOrderedSmartPlaylistTracks(
            smartPlaylistSettings.playlistOrderData,
            smartPlaylistSavedTracks
        );

        // Finally, filter out any ordered saved tracks that are over the limit
        const orderedAndFilteredSmartPlaylistSavedTracks = await getFilteredSmartPlaylistTracks(
            smartPlaylistSettings.playlistLimitData,
            orderedSmartPlaylistSavedTracks
        );

        return Promise.resolve(orderedAndFilteredSmartPlaylistSavedTracks);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

function doesTrackBelongInPlaylist(savedTrack, playlistRules)
{
    for (const playlistRule of playlistRules)
    {
        // If even a single rule is broken, short circuit because the track does not belong
        if (!playlistRule.function(savedTrack, playlistRule.data, playlistRule.operator))
        {
            return false;
        }
    }

    // This track follows all the rules, so it does belong in the playlist
    return true;
}

function getPlaylistDescription(playlistLimitData, playlistOrderData)
{
    let playlistDescription = playlistDescriptionPrefix;

    if (playlistLimitData.enabled)
    {
        playlistDescription += playlistDescriptionLimitPrefix + playlistDescriptionSpace +
            playlistLimitData.userSpecifiedValue + playlistDescriptionSpace +
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
