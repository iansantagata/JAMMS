"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Limits Logic
function getPlaylistLimits(req)
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
}
