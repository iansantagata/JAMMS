"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const units = require(path.join(utilityModulesPath, "unitConversion.js"));

// Default Constant Values
const maximumPlaylistSongLimit = 10000;

// Limits Logic
exports.getPlaylistLimits = function(req)
{
    // Default object to return if playlist limiting is disabled or errors arise
    const defaultPlaylistLimitData = {
        enabled: false,
        type: null,
        userSpecifiedType: null,
        userSpecifiedValue: null,
        value: null
    };

    // Create a new object to build and return (cannot use same object because of shallow references)
    const playlistLimitData = {
        ...defaultPlaylistLimitData
    };

    playlistLimitData.value = req.body.playlistLimitValue;
    if (!playlistLimitData.value)
    {
        return defaultPlaylistLimitData;
    }

    if (playlistLimitData.value <= 0)
    {
        logger.logWarn(`Playlist limit value entered is zero or negative: "${playlistLimitData.value}". Falling back to using no limit.`);
        return defaultPlaylistLimitData;
    }

    if (playlistLimitData.value > maximumPlaylistSongLimit)
    {
        logger.logWarn(`Playlist limit value entered is greater than ten thosand: "${playlistLimitData.value}". Falling back to using limit of ${maximumPlaylistSongLimit}.`);
        playlistLimitData.value = maximumPlaylistSongLimit;
    }

    // Make sure that the user specified playlist limit is a valid one that the app knows how to handle
    playlistLimitData.userSpecifiedValue = playlistLimitData.value;
    playlistLimitData.userSpecifiedType = req.body.playlistLimitType;
    switch (playlistLimitData.userSpecifiedType)
    {
        // Convert the value from its time unit to milliseconds to be easier to work with (if applicable)
        case "minutes":
            playlistLimitData.value = units.getMillisecondsFromMinutes(playlistLimitData.value);
            playlistLimitData.type = "milliseconds";
            break;

        case "hours":
            playlistLimitData.value = units.getMillisecondsFromHours(playlistLimitData.value);
            playlistLimitData.type = "milliseconds";
            break;

        case "songs":
            playlistLimitData.type = "songs";
            break;

        // If the user specified an unknown limit type somehow, remove limitations completely since it is unknown how to handle it
        default:
            return defaultPlaylistLimitData;
    }

    // If we made it this far without exiting, then we have valid playlist limit data
    playlistLimitData.enabled = true;
    return playlistLimitData;
};

exports.getPlaylistTracksLimitedBySongs = function(savedTracksInPlaylist, songLimit)
{
    let numberOfTracks = savedTracksInPlaylist.length;
    while (numberOfTracks > songLimit)
    {
        // If we have to remove something, it should be the last track in the list based on ordering
        savedTracksInPlaylist.pop();
        numberOfTracks--;
    }

    return savedTracksInPlaylist;
};

exports.getPlaylistTracksLimitedByMsec = function(savedTracksInPlaylist, msecLimit)
{
    let timeOfTracksInPlaylistInMsec = 0;
    for (const savedTrackInPlaylist of savedTracksInPlaylist)
    {
        timeOfTracksInPlaylistInMsec += dataRetrieval.getDurationFromSavedTrack(savedTrackInPlaylist);
    }

    while (timeOfTracksInPlaylistInMsec > msecLimit)
    {
        // If we have to remove something, it should be the last track in the list based on ordering
        const removedTrack = savedTracksInPlaylist.pop();
        timeOfTracksInPlaylistInMsec -= dataRetrieval.getDurationFromSavedTrack(removedTrack);
    }

    return savedTracksInPlaylist;
};

exports.getPlaylistTracksLimitedByUnknown = function(savedTracksInPlaylist)
{
    return savedTracksInPlaylist;
};
