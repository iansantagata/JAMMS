"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Rules Logic
function ruleBySongName(track, songNameRuleData, operatorFunction)
{
    const trackSongName = getTrackNameFromSavedTrack(track);
    const normalizedSongNameRuleData = songNameRuleData.toUpperCase();

    return operatorFunction(trackSongName, normalizedSongNameRuleData);
}

function ruleByAlbumName(track, albumNameRuleData, operatorFunction)
{
    const trackAlbumName = getAlbumNameFromSavedTrack(track);
    const normalizedAlbumNameRuleData = albumNameRuleData.toUpperCase();

    return operatorFunction(trackAlbumName, normalizedAlbumNameRuleData);
}

function ruleByReleaseYear(track, releaseYearRuleData, operatorFunction)
{
    const trackReleaseYear = getReleaseYearFromSavedTrack(track);
    return operatorFunction(trackReleaseYear, releaseYearRuleData);
}

function ruleByArtistName(track, artistNameRuleData, operatorFunction)
{
    const trackArtistNames = getArtistNamesFromSavedTrack(track);
    const normalizedArtistNameRuleData = artistNameRuleData.toUpperCase();

    return operatorFunction(trackArtistNames, normalizedArtistNameRuleData);
}

function ruleByGenre(track, genreNameRuleData, operatorFunction)
{
    const trackGenres = getGenresFromSavedTrack(track);
    const normalizedGenreNameRuleData = genreNameRuleData.toUpperCase();

    return operatorFunction(trackGenres, normalizedGenreNameRuleData);
}

function getRuleOperatorFunction(operator)
{
    let operatorFunction = () => {};

    switch (operator)
    {
        case "notEqual":
            operatorFunction = notEquals;
            break;
        case "greaterThan":
            operatorFunction = greaterThan;
            break;
        case "greaterThanOrEqual":
            operatorFunction = greaterThanOrEqualTo;
            break;
        case "lessThan":
            operatorFunction = lessThan;
            break;
        case "lessThanOrEqual":
            operatorFunction = lessThanOrEqualTo;
            break;
        case "contains":
            operatorFunction = contains;
            break;
        case "doesNotContain":
            operatorFunction = doesNotContain;
            break;
        case "equal":
        default:
            operatorFunction = equals;
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
            ruleFunction = ruleByGenre;
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
