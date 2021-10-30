"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Smart Playlist Modules
const smartPlaylistModulesPath = path.join(__dirname, "..", "smartPlaylistModules");
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));
const limits = require(path.join(smartPlaylistModulesPath, "limits.js"));
const ordering = require(path.join(smartPlaylistModulesPath, "ordering.js"));
const rules = require(path.join(smartPlaylistModulesPath, "rules.js"));
const smartPlaylistUtils = require(path.join(smartPlaylistModulesPath, "smartPlaylistUtils.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const chunk = require(path.join(utilityModulesPath, "chunk.js"));
const logger = require(path.join(utilityModulesPath, "logger.js"));
const errorUtils = require(path.join(utilityModulesPath, "errorUtils.js"));
const spotifyClient = require(path.join(utilityModulesPath, "spotifyClient.js"));

// Default Constant Values
const playlistNamePrefix = "JAMMS: ";

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

        const smartPlaylistPreviewTracks = await smartPlaylistUtils.getSmartPlaylistTracks(req, res, smartPlaylistSettings);

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
        const smartPlaylistTracks = await smartPlaylistUtils.getSmartPlaylistTracks(req, res, smartPlaylistSettings);
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
        req.body.playlistDescription = smartPlaylistUtils.getPlaylistDescription(playlistLimitData, playlistOrderData);
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
