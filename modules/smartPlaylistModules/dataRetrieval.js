"use strict";

// Data Retrieval Logic
exports.getUriFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.uri;
};

exports.getTrackNameFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.name.toUpperCase();
};

exports.getAlbumNameFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.album.name.toUpperCase();
};

exports.getArtistsFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.artists;
};

exports.getArtistNamesFromSavedTrack = function(savedTrack)
{
    // A track can have multiple artists and is usually in a particular order
    // Take all the artists on a track in array form to get all of the artists
    return exports.getArtistsFromSavedTrack(savedTrack)
        .map(exports.getArtistNameFromArtist);
};

exports.getReleaseDateFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.album.release_date;
};

exports.getReleaseYearFromSavedTrack = function(savedTrack)
{
    // The release year is usually YYYY-MM-DD but can optionally have month or day level precision
    // Grab the first four characters present to get the year value only as it should always be present
    const yearCharactersLength = 4;
    return exports.getReleaseDateFromSavedTrack(savedTrack)
        .substr(0, yearCharactersLength);
};

exports.getAddDateFromSavedTrack = function(savedTrack)
{
    return savedTrack.added_at;
};

exports.getDurationFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.duration_ms;
};

exports.getPopularityFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.popularity;
};

exports.getGenresFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.genres;
};

exports.getArtistNameFromArtist = function(artist)
{
    return artist.name.toUpperCase();
};

exports.getArtistIdFromArtist = function(artist)
{
    return artist.id;
};
