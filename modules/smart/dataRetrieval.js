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

// Data Retrieval Logic
function getUriFromSavedTrack(savedTrack)
{
    return savedTrack.track.uri;
}

function getTrackNameFromSavedTrack(savedTrack)
{
    return savedTrack.track.name.toUpperCase();
}

function getAlbumNameFromSavedTrack(savedTrack)
{
    return savedTrack.track.album.name.toUpperCase();
}

function getArtistsFromSavedTrack(savedTrack)
{
    return savedTrack.track.artists;
}

function getArtistNamesFromSavedTrack(savedTrack)
{
    // A track can have multiple artists and is usually in a particular order
    // Take all the artists on a track in array form to get all of the artists
    return getArtistsFromSavedTrack(savedTrack)
        .map(getArtistNameFromArtist);
}

function getReleaseDateFromSavedTrack(savedTrack)
{
    return savedTrack.track.album.release_date;
}

function getReleaseYearFromSavedTrack(savedTrack)
{
    // The release year is usually YYYY-MM-DD but can optionally have month or day level precision
    // Grab the first four characters present to get the year value only as it should always be present
    const yearCharactersLength = 4;
    return getReleaseDateFromSavedTrack(savedTrack)
        .substr(0, yearCharactersLength);
}

function getAddDateFromSavedTrack(savedTrack)
{
    return savedTrack.added_at;
}

function getDurationFromSavedTrack(savedTrack)
{
    return savedTrack.track.duration_ms;
}

function getPopularityFromSavedTrack(savedTrack)
{
    return savedTrack.track.popularity;
}

function getGenresFromSavedTrack(savedTrack)
{
    return savedTrack.track.genres;
}

function getArtistNameFromArtist(artist)
{
    return artist.name.toUpperCase();
}

function getArtistIdFromArtist(artist)
{
    return artist.id;
}
