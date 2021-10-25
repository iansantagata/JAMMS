"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));
const operators = require(path.join(smartPlaylistModulesPath, "operators.js"));

// Default Constant Values
const noop = () => {};

const secondsToMsecConversion = 1000;
const minutesToSecondsConversion = 60;

// Rules Logic
exports.getPlaylistRules = function(req)
{
    const rules = [];
    const parsedRules = [];

    for (const parameter in req.body)
    {
        if (parameter.startsWith("playlistRule"))
        {
            const parameterSplit = parameter.split("-");
            const ruleNumber = parameterSplit[parameterSplit.length - 1];

            if (!parsedRules.includes(ruleNumber))
            {
                const ruleType = req.body[`playlistRuleType-${ruleNumber}`];
                const ruleOperator = req.body[`playlistRuleOperator-${ruleNumber}`];
                let ruleData = req.body[`playlistRuleData-${ruleNumber}`];

                const ruleOperatorFunction = getRuleOperatorFunction(ruleOperator);
                if (ruleOperatorFunction === noop)
                {
                    throw new Error("Failed to find valid rule operator function");
                }

                const ruleFunction = getRuleFunction(ruleType);
                if (ruleFunction === noop)
                {
                    throw new Error("Failed to find valid rule by function");
                }

                // Handle the special case where user input needs to be converted a different unit
                if (ruleFunction === ruleByDuration)
                {
                    ruleData *= minutesToSecondsConversion * secondsToMsecConversion;
                }

                const ruleFromParameters =
                {
                    data: ruleData,
                    function: ruleFunction,
                    operator: ruleOperatorFunction
                };

                rules.push(ruleFromParameters);
                parsedRules.push(ruleNumber);
            }
        }
    }

    return rules;
};

// Local Helper Functions
function getRuleOperatorFunction(operator)
{
    let operatorFunction = noop;

    switch (operator)
    {
        case "notEqual":
            operatorFunction = operators.notEquals;
            break;

        case "greaterThan":
            operatorFunction = operators.greaterThan;
            break;

        case "greaterThanOrEqual":
            operatorFunction = operators.greaterThanOrEqualTo;
            break;

        case "lessThan":
            operatorFunction = operators.lessThan;
            break;

        case "lessThanOrEqual":
            operatorFunction = operators.lessThanOrEqualTo;
            break;

        case "contains":
            operatorFunction = operators.contains;
            break;

        case "doesNotContain":
            operatorFunction = operators.doesNotContain;
            break;

        case "equal":
            operatorFunction = operators.equals;
            break;

        default:
            break;
    }

    return operatorFunction;
}

function getRuleFunction(ruleType)
{
    let ruleFunction = noop;

    switch (ruleType)
    {
        case "artist":
            ruleFunction = ruleByArtistName;
            break;

        case "album":
            ruleFunction = ruleByAlbumName;
            break;

        case "duration":
            ruleFunction = ruleByDuration;
            break;

        case "genre":
            ruleFunction = exports.ruleByGenre;
            break;

        case "releaseDate":
            ruleFunction = ruleByReleaseDate;
            break;

        case "song":
            ruleFunction = ruleBySongName;
            break;

        case "tempo":
            ruleFunction = exports.ruleByBeatsPerMinute;
            break;

        default:
            break;
    }

    return ruleFunction;
}

// Special Rule By X Functions
exports.ruleByGenre = function(track, genreNameRuleData, operatorFunction)
{
    const trackGenres = dataRetrieval.getGenresFromSavedTrack(track);
    const normalizedGenreNameRuleData = genreNameRuleData.toUpperCase();

    return operatorFunction(trackGenres, normalizedGenreNameRuleData);
};

exports.ruleByBeatsPerMinute = function(track, beatsPerMinuteRuleData, operatorFunction)
{
    const trackBeatsPerMinute = dataRetrieval.getBeatsPerMinuteFromSavedTrack(track);
    return operatorFunction(trackBeatsPerMinute, beatsPerMinuteRuleData);
};

// Generic Rule By X Functions
function ruleByArtistName(track, artistNameRuleData, operatorFunction)
{
    const trackArtistNames = dataRetrieval.getArtistNamesFromSavedTrack(track);
    const normalizedArtistNameRuleData = artistNameRuleData.toUpperCase();

    return operatorFunction(trackArtistNames, normalizedArtistNameRuleData);
}

function ruleByAlbumName(track, albumNameRuleData, operatorFunction)
{
    const trackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(track);
    const normalizedAlbumNameRuleData = albumNameRuleData.toUpperCase();

    return operatorFunction(trackAlbumName, normalizedAlbumNameRuleData);
}

function ruleByDuration(track, durationRuleData, operatorFunction)
{
    const trackDuration = dataRetrieval.getDurationFromSavedTrack(track);
    return operatorFunction(trackDuration, durationRuleData);
}

function ruleByReleaseDate(track, releaseDateRuleData, operatorFunction)
{
    const trackReleaseDate = dataRetrieval.getReleaseDateFromSavedTrack(track);
    return operatorFunction(trackReleaseDate, releaseDateRuleData);
}

function ruleBySongName(track, songNameRuleData, operatorFunction)
{
    const trackSongName = dataRetrieval.getTrackNameFromSavedTrack(track);
    const normalizedSongNameRuleData = songNameRuleData.toUpperCase();

    return operatorFunction(trackSongName, normalizedSongNameRuleData);
}
