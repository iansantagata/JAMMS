"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));

// Default Constant Values
const maximumPlaylistSongLimit = 10000;

const secondsToMsecConversion = 1000;
const minutesToSecondsConversion = 60;
const hoursToMinutesConversion = 60;

// Limits Logic
exports.getPlaylistLimits = function(req)
{
    // Default object to return if playlist limiting is disabled or errors arise
    const defaultPlaylistLimitData = {
        enabled: false,
        type: null,
        userSpecifiedType: null,
        value: null
    };

    // Create a new object to build and return (cannot use same object because of shallow references)
    const playlistLimitData = {
        ...defaultPlaylistLimitData
    };

    playlistLimitData.enabled = Boolean(req.body.playlistLimitEnabled);
    if (!playlistLimitData.enabled)
    {
        return defaultPlaylistLimitData;
    }

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
    playlistLimitData.userSpecifiedType = req.body.playlistLimitType;
    switch (playlistLimitData.userSpecifiedType)
    {
        // Convert the value from its time unit to milliseconds to be easier to work with (if applicable)
        case "minutes":
            playlistLimitData.value *= minutesToSecondsConversion * secondsToMsecConversion;
            playlistLimitData.type = "milliseconds";
            break;

        case "hours":
            playlistLimitData.value *= hoursToMinutesConversion * minutesToSecondsConversion * secondsToMsecConversion;
            playlistLimitData.type = "milliseconds";
            break;

        case "songs":
            playlistLimitData.type = "songs";
            break;

        // If the user specified an unknown limit type somehow, remove limitations completely since it is unknown how to handle it
        default:
            return defaultPlaylistLimitData;
    }

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
}

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
}

exports.getPlaylistTracksLimitedByUnknown = function(savedTracksInPlaylist, limit)
{
    return savedTracksInPlaylist;
}
