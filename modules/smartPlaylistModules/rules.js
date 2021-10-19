"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const helperFunctions = require(path.join(smartPlaylistModulesPath, "helperFunctions.js"));
const enrichment = require(path.join(smartPlaylistModulesPath, "enrichment.js"));
const specialRules = require(path.join(smartPlaylistModulesPath, "specialRules.js"));
const dataRetrieval = require(path.join(smartPlaylistModulesPath, "dataRetrieval.js"));
const comparisons = require(path.join(smartPlaylistModulesPath, "comparisons.js"));
const limits = require(path.join(smartPlaylistModulesPath, "limits.js"));
const operators = require(path.join(smartPlaylistModulesPath, "operators.js"));
const ordering = require(path.join(smartPlaylistModulesPath, "ordering.js"));
const rules = require(path.join(smartPlaylistModulesPath, "rules.js"));

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
                const ruleData = req.body[`playlistRuleData-${ruleNumber}`];

                const ruleOperatorFunction = getRuleOperatorFunction(ruleOperator);
                const ruleFunction = getRuleFunction(ruleType);

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
}

// Local Helper Functions
function getRuleOperatorFunction(operator)
{
    let operatorFunction = () => {};

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
        default:
            operatorFunction = operators.equals;
            break;
    }

    return operatorFunction;
}

function getRuleFunction(ruleType)
{
    let ruleFunction = () => {};

    switch (ruleType)
    {
        case "artist":
            ruleFunction = ruleByArtistName;
            break;

        case "album":
            ruleFunction = ruleByAlbumName;
            break;

        case "genre":
            ruleFunction = exports.ruleByGenre;
            break;

        case "year":
            ruleFunction = ruleByReleaseYear;
            break;

        case "song":
        default:
            ruleFunction = ruleBySongName;
            break;
    }

    return ruleFunction;
}

// Specific Rule By X Functions
exports.ruleByGenre = function(track, genreNameRuleData, operatorFunction)
{
    const trackGenres = dataRetrieval.getGenresFromSavedTrack(track);
    const normalizedGenreNameRuleData = genreNameRuleData.toUpperCase();

    return operatorFunction(trackGenres, normalizedGenreNameRuleData);
}

function ruleBySongName(track, songNameRuleData, operatorFunction)
{
    const trackSongName = dataRetrieval.getTrackNameFromSavedTrack(track);
    const normalizedSongNameRuleData = songNameRuleData.toUpperCase();

    return operatorFunction(trackSongName, normalizedSongNameRuleData);
}

function ruleByAlbumName(track, albumNameRuleData, operatorFunction)
{
    const trackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(track);
    const normalizedAlbumNameRuleData = albumNameRuleData.toUpperCase();

    return operatorFunction(trackAlbumName, normalizedAlbumNameRuleData);
}

function ruleByReleaseYear(track, releaseYearRuleData, operatorFunction)
{
    const trackReleaseYear = dataRetrieval.getReleaseYearFromSavedTrack(track);
    return operatorFunction(trackReleaseYear, releaseYearRuleData);
}

function ruleByArtistName(track, artistNameRuleData, operatorFunction)
{
    const trackArtistNames = dataRetrieval.getArtistNamesFromSavedTrack(track);
    const normalizedArtistNameRuleData = artistNameRuleData.toUpperCase();

    return operatorFunction(trackArtistNames, normalizedArtistNameRuleData);
}
