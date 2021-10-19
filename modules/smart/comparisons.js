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

// Comparisons Logic
function compareBySongAscending(targetTrack, existingTrack)
{
    const targetTrackSongName = getTrackNameFromSavedTrack(targetTrack);
    const existingTrackSongName = getTrackNameFromSavedTrack(existingTrack);

    if (targetTrackSongName < existingTrackSongName)
    {
        return -1;
    }

    if (targetTrackSongName > existingTrackSongName)
    {
        return 1;
    }

    return 0;
}

function compareBySongDescending(targetTrack, existingTrack)
{
    const targetTrackSongName = getTrackNameFromSavedTrack(targetTrack);
    const existingTrackSongName = getTrackNameFromSavedTrack(existingTrack);

    if (targetTrackSongName < existingTrackSongName)
    {
        return 1;
    }

    if (targetTrackSongName > existingTrackSongName)
    {
        return -1;
    }

    return 0;
}

function compareByLibraryAscending(targetTrack, existingTrack)
{
    const targetTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(targetTrack);
    const existingTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(existingTrack);

    if (targetTrackLibraryAddTimeStamp < existingTrackLibraryAddTimeStamp)
    {
        return -1;
    }

    if (targetTrackLibraryAddTimeStamp > existingTrackLibraryAddTimeStamp)
    {
        return 1;
    }

    return 0;
}

function compareByLibraryDescending(targetTrack, existingTrack)
{
    const targetTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(targetTrack);
    const existingTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(existingTrack);

    if (targetTrackLibraryAddTimeStamp < existingTrackLibraryAddTimeStamp)
    {
        return 1;
    }

    if (targetTrackLibraryAddTimeStamp > existingTrackLibraryAddTimeStamp)
    {
        return -1;
    }

    return 0;
}

function compareByAlbumAscending(targetTrack, existingTrack)
{
    const targetTrackAlbumName = getAlbumNameFromSavedTrack(targetTrack);
    const existingTrackAlbumName = getAlbumNameFromSavedTrack(existingTrack);

    if (targetTrackAlbumName < existingTrackAlbumName)
    {
        return -1;
    }

    if (targetTrackAlbumName > existingTrackAlbumName)
    {
        return 1;
    }

    return 0;
}

function compareByAlbumDescending(targetTrack, existingTrack)
{
    const targetTrackAlbumName = getAlbumNameFromSavedTrack(targetTrack);
    const existingTrackAlbumName = getAlbumNameFromSavedTrack(existingTrack);

    if (targetTrackAlbumName < existingTrackAlbumName)
    {
        return 1;
    }

    if (targetTrackAlbumName > existingTrackAlbumName)
    {
        return -1;
    }

    return 0;
}

function compareByReleaseAscending(targetTrack, existingTrack)
{
    const targetTrackReleaseDate = getReleaseDateFromSavedTrack(targetTrack);
    const existingTrackReleaseDate = getReleaseDateFromSavedTrack(existingTrack);

    if (targetTrackReleaseDate < existingTrackReleaseDate)
    {
        return -1;
    }

    if (targetTrackReleaseDate > existingTrackReleaseDate)
    {
        return 1;
    }

    return 0;
}

function compareByReleaseDescending(targetTrack, existingTrack)
{
    const targetTrackReleaseDate = getReleaseDateFromSavedTrack(targetTrack);
    const existingTrackReleaseDate = getReleaseDateFromSavedTrack(existingTrack);

    if (targetTrackReleaseDate < existingTrackReleaseDate)
    {
        return 1;
    }

    if (targetTrackReleaseDate > existingTrackReleaseDate)
    {
        return -1;
    }

    return 0;
}

function compareByArtistAscending(targetTrack, existingTrack)
{
    const targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack)
        .join(", ");

    const existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack)
        .join(", ");

    if (targetTrackArtists < existingTrackArtists)
    {
        return -1;
    }

    if (targetTrackArtists > existingTrackArtists)
    {
        return 1;
    }

    return 0;
}

function compareByArtistDescending(targetTrack, existingTrack)
{
    const targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack)
        .join(", ");

    const existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack)
        .join(", ");

    if (targetTrackArtists < existingTrackArtists)
    {
        return 1;
    }

    if (targetTrackArtists > existingTrackArtists)
    {
        return -1;
    }

    return 0;
}

function compareByDurationAscending(targetTrack, existingTrack)
{
    const targetTrackDuration = getDurationFromSavedTrack(targetTrack);
    const existingTrackDuration = getDurationFromSavedTrack(existingTrack);

    if (targetTrackDuration < existingTrackDuration)
    {
        return -1;
    }

    if (targetTrackDuration > existingTrackDuration)
    {
        return 1;
    }

    return 0;
}

function compareByDurationDescending(targetTrack, existingTrack)
{
    const targetTrackDuration = getDurationFromSavedTrack(targetTrack);
    const existingTrackDuration = getDurationFromSavedTrack(existingTrack);

    if (targetTrackDuration < existingTrackDuration)
    {
        return 1;
    }

    if (targetTrackDuration > existingTrackDuration)
    {
        return -1;
    }

    return 0;
}

function compareByPopularityAscending(targetTrack, existingTrack)
{
    const targetTrackPopularity = getPopularityFromSavedTrack(targetTrack);
    const existingTrackPopularity = getPopularityFromSavedTrack(existingTrack);

    if (targetTrackPopularity < existingTrackPopularity)
    {
        return -1;
    }

    if (targetTrackPopularity > existingTrackPopularity)
    {
        return 1;
    }

    return 0;
}

function compareByPopularityDescending(targetTrack, existingTrack)
{
    const targetTrackPopularity = getPopularityFromSavedTrack(targetTrack);
    const existingTrackPopularity = getPopularityFromSavedTrack(existingTrack);

    if (targetTrackPopularity < existingTrackPopularity)
    {
        return 1;
    }

    if (targetTrackPopularity > existingTrackPopularity)
    {
        return -1;
    }

    return 0;
}
