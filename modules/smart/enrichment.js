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

// Enrichment Logic
function enrichTrackWithGenres(savedTracks, artistIdToGenresMap)
{
    try
    {
        for (const savedTrack of savedTracks)
        {
            // Genre is only defined within Spotify on the artist object
            // Convert a track's artists to their artist IDs to begin the process
            const artistIds = getArtistsFromSavedTrack(savedTrack)
                .map(getArtistIdFromArtist);

            // For every artist ID, check the map for artist IDs to genres
            let genresForTrack = [];

            for (const artistId of artistIds)
            {
                if (artistIdToGenresMap.has(artistId))
                {
                    // We already have a mapping from this artist ID to genres, so use those genres
                    const mappedGenresForArtist = artistIdToGenresMap.get(artistId);
                    genresForTrack = genresForTrack.concat(mappedGenresForArtist);
                }
            }

            // De-duplicate all the genres already found from artists for this track
            const genresForTrackSet = new Set(genresForTrack);

            // Finally, set the genres onto the track object
            // If there are no genres found, this will set an empty array in this property
            const uniqueGenresForTrack = Array.from(genresForTrackSet);
            savedTrack.track.genres = uniqueGenresForTrack;
        }

        // When finished adding genres to the tracks, return the modified tracks
        return Promise.resolve(savedTracks);
    }
    catch (error)
    {
        // If there is a problem with the enrichment, then a user's request related to genre data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to enrich tracks with genres: ${error.message}`);
        return Promise.reject(error);
    }
}
