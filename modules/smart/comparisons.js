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

// Comparisons Logic
exports.compareBySongAscending = function(targetTrack, existingTrack)
{
    const targetTrackSongName = dataRetrieval.getTrackNameFromSavedTrack(targetTrack);
    const existingTrackSongName = dataRetrieval.getTrackNameFromSavedTrack(existingTrack);

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

exports.compareBySongDescending = function(targetTrack, existingTrack)
{
    const targetTrackSongName = dataRetrieval.getTrackNameFromSavedTrack(targetTrack);
    const existingTrackSongName = dataRetrieval.getTrackNameFromSavedTrack(existingTrack);

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

exports.compareByLibraryAscending = function(targetTrack, existingTrack)
{
    const targetTrackLibraryAddTimeStamp = dataRetrieval.getAddDateFromSavedTrack(targetTrack);
    const existingTrackLibraryAddTimeStamp = dataRetrieval.getAddDateFromSavedTrack(existingTrack);

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

exports.compareByLibraryDescending = function(targetTrack, existingTrack)
{
    const targetTrackLibraryAddTimeStamp = dataRetrieval.getAddDateFromSavedTrack(targetTrack);
    const existingTrackLibraryAddTimeStamp = dataRetrieval.getAddDateFromSavedTrack(existingTrack);

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

exports.compareByAlbumAscending = function(targetTrack, existingTrack)
{
    const targetTrackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(targetTrack);
    const existingTrackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(existingTrack);

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

exports.compareByAlbumDescending = function(targetTrack, existingTrack)
{
    const targetTrackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(targetTrack);
    const existingTrackAlbumName = dataRetrieval.getAlbumNameFromSavedTrack(existingTrack);

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

exports.compareByReleaseAscending = function(targetTrack, existingTrack)
{
    const targetTrackReleaseDate = dataRetrieval.getReleaseDateFromSavedTrack(targetTrack);
    const existingTrackReleaseDate = dataRetrieval.getReleaseDateFromSavedTrack(existingTrack);

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

exports.compareByReleaseDescending = function(targetTrack, existingTrack)
{
    const targetTrackReleaseDate = dataRetrieval.getReleaseDateFromSavedTrack(targetTrack);
    const existingTrackReleaseDate = dataRetrieval.getReleaseDateFromSavedTrack(existingTrack);

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

exports.compareByArtistAscending = function(targetTrack, existingTrack)
{
    const targetTrackArtists = dataRetrieval
        .getArtistNamesFromSavedTrack(targetTrack)
        .join(", ");

    const existingTrackArtists = dataRetrieval
        .getArtistNamesFromSavedTrack(existingTrack)
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

exports.compareByArtistDescending = function(targetTrack, existingTrack)
{
    const targetTrackArtists = dataRetrieval
        .getArtistNamesFromSavedTrack(targetTrack)
        .join(", ");

    const existingTrackArtists = dataRetrieval
        .getArtistNamesFromSavedTrack(existingTrack)
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

exports.compareByDurationAscending = function(targetTrack, existingTrack)
{
    const targetTrackDuration = dataRetrieval.getDurationFromSavedTrack(targetTrack);
    const existingTrackDuration = dataRetrieval.getDurationFromSavedTrack(existingTrack);

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

exports.compareByDurationDescending = function(targetTrack, existingTrack)
{
    const targetTrackDuration = dataRetrieval.getDurationFromSavedTrack(targetTrack);
    const existingTrackDuration = dataRetrieval.getDurationFromSavedTrack(existingTrack);

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

exports.compareByPopularityAscending = function(targetTrack, existingTrack)
{
    const targetTrackPopularity = dataRetrieval.getPopularityFromSavedTrack(targetTrack);
    const existingTrackPopularity = dataRetrieval.getPopularityFromSavedTrack(existingTrack);

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

exports.compareByPopularityDescending = function(targetTrack, existingTrack)
{
    const targetTrackPopularity = dataRetrieval.getPopularityFromSavedTrack(targetTrack);
    const existingTrackPopularity = dataRetrieval.getPopularityFromSavedTrack(existingTrack);

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
