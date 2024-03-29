"use strict";

// Data Retrieval Logic

// Retrieve Native Data from Saved Track Object
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

// Retrieve Enriched Data from Saved Track Object
exports.getGenresFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.genres;
};

exports.getAcousticnessFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.acousticness;
};

exports.getBeatsPerMinuteFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.tempo;
};

exports.getBeatsPerMeasureFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.time_signature;
};

exports.getDanceabilityFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.danceability;
};

exports.getDecibelsFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.loudness;
};

exports.getEnergyFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.energy;
};

exports.getInstrumentalnessFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.instrumentalness;
};

exports.getLivenessFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.liveness;
};

exports.getSpeechinessFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.speechiness;
};

exports.getValenceFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.audio_features.valence;
};

// Retrieve Native Data from Artist Object
exports.getArtistNameFromArtist = function(artist)
{
    return artist.name.toUpperCase();
};

exports.getArtistIdFromArtist = function(artist)
{
    return artist.id;
};
