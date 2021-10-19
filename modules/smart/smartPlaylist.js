"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const spotifyClient = require(path.join(customModulePath, "spotifyClient.js"));
const logger = require(path.join(customModulePath, "logger.js"));

// Smart Playlist Modules
const smartPlaylistModulesPath = __dirname;
const helperFunctions = require(path.join(smartPlaylistModulesPath, "helperFunctions.js"));
const enrichment = require(path.join(smartPlaylistModulesPath, "enrichment.js"));
const specialRules = require(path.join(smartPlaylistModulesPath, "specialRules.js"));

// Default Constant Values
const playlistNamePrefix = "JAMMS: ";
const playlistDescriptionPrefix = "Uses only songs I have liked. ";
const playlistDescriptionLimitPrefix = "Limited to ";
const playlistDescriptionOrderPrefix = "Sorted by ";
const playlistDescriptionIn = "in";
const playlistDescriptionOrder = "order";
const playlistDescriptionSpace = " ";
const playlistDescriptionPeriod = ".";

const playlistPreviewLimit = 25;
const tracksPerPageDefault = 50;
const maximumPlaylistSongLimit = 10000;
const maximumRecursionLimit = 3;

const artistGenreRetrievalLimit = 50;
const trackAddPlaylistLimit = 100;

const secondsToMsecConversion = 1000;
const minutesToSecondsConversion = 60;
const hoursToMinutesConversion = 60;

// Smart Playlist Logic
exports.createSmartPlaylistPage = function(req, res, next)
{
    try
    {
        // Simply show the user the page to create a new smart playlist
        res.location("/createSmartPlaylist");
        res.render("createSmartPlaylist");
    }
    catch (error)
    {
        logger.logError(`Failed to get create smart playlist page: ${error.message}`);
        next(error);
    }
};

exports.getSmartPlaylistPreview = async function(req, res, next)
{
    try
    {
        // Set that this is to be a playlist preview (which will short circuit some extra work not needed for a preview)
        req.body.isPlaylistPreview = true;

        const smartPlaylistData = await getSmartPlaylistData(req, res);
        const playlistPreviewData = smartPlaylistData.trackData;

        // Send the preview data back to the caller without reloading the page
        res.set("Content-Type", "application/json");
        res.send(playlistPreviewData);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist preview: ${error.message}`);
        next(error);
    }
};

exports.createSmartPlaylist = async function(req, res, next)
{
    try
    {
        // Get track data and information needed to create the smart playlist
        const smartPlaylistData = await getSmartPlaylistData(req, res);
        if (!smartPlaylistData ||
            !smartPlaylistData.trackData ||
            !Array.isArray(smartPlaylistData.trackData) ||
            smartPlaylistData.trackData.length <= 0)
        {
            throw new Error("Failed to get valid smart playlist data");
        }

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);

        // For visibility purposes, prepend the name of the smart playlist with the app name
        req.body.playlistName = playlistNamePrefix + req.body.playlistName;
        req.body.playlistDescription = getPlaylistDescription(smartPlaylistData.limitData, smartPlaylistData.orderData);
        const createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        const playlistId = createPlaylistResponse.id;
        const trackUris = smartPlaylistData.trackData.map(getUriFromSavedTrack);
        const trackUriChunks = helperFunctions.getArrayChunks(trackUris, trackAddPlaylistLimit);
        req.body.playlistId = playlistId;

        // Add songs to the playlist in batches since there is a limit to how many can be added at once
        for (const trackUriChunk of trackUriChunks)
        {
            req.body.trackUris = trackUriChunk;
            await spotifyClient.addTracksToPlaylist(req, res);
        }

        // Finally, we want to show the user info about their new playlist, so retrieve that data after songs were inserted
        req.query.playlistId = playlistId;
        const getPlaylistResponse = await spotifyClient.getSinglePlaylist(req, res);

        const playlistData = {
            deleted: false,
            followersCount: getPlaylistResponse.followers.total,
            images: getPlaylistResponse.images,
            isCollaborative: getPlaylistResponse.collaborative,
            isPublic: getPlaylistResponse.public,
            playlistDescription: getPlaylistResponse.description,
            playlistId: getPlaylistResponse.id,
            playlistName: getPlaylistResponse.name,
            trackCount: getPlaylistResponse.tracks.total
        };

        // Shove the playlist response data onto the playlist page for the user to interact with
        res.location("/playlist");
        res.render("viewPlaylist", playlistData);
    }
    catch (error)
    {
        logger.logError(`Failed to create smart playlist: ${error.message}`);
        next(error);
    }
};

// Local Helper Functions

// Track Retrieval Functions
async function getSmartPlaylistData(req, res)
{
    try
    {
        // First, process all of the rules and optional settings from the request
        const isPlaylistPreview = Boolean(req.body.isPlaylistPreview);
        const playlistLimitData = getPlaylistLimits(req);
        const playlistOrderData = getPlaylistOrdering(req);
        const playlistRules = getPlaylistRules(req);

        // Make sure that any special rules are extracted and any additional structures are setup
        // This is done so that if a track does not have the data we need,
        // Then the app can retrieve that data and enrich the track with the data manually
        const playlistSpecialRuleFlags = specialRules.getPlaylistSpecialRuleFlags(playlistRules);
        let artistIdToGenresMap = new Map();

        // Keep track of the tracks to be in the playlist and the order of them as well
        const tracksInPlaylist = [];
        let trackOrderingInPlaylist = [];
        let timeOfTracksInPlaylistInMsec = 0;
        let canRetrieveMoreBatches = true;

        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = tracksPerPageDefault; // Maximum value of tracks to retrieve per page

        // Loop over all songs in the library in batches
        while (canRetrieveMoreBatches)
        {
            // Get all the tracks in this batch
            const getAllTracksBatchedResponse = await spotifyClient.getAllTracks(req, res);

            // Get data on the tracks processed
            const tracksProcessed = getAllTracksBatchedResponse.offset + getAllTracksBatchedResponse.limit;
            const totalTracks = getAllTracksBatchedResponse.total;
            let tracksInBatch = getAllTracksBatchedResponse.items;

            // Increment the page number to retrieve the next batch of tracks when ready
            req.query.pageNumber++;

            // If there are no more tracks to retrieve from the library after these ones, mark that so we do not continue endlessly
            if (tracksProcessed >= totalTracks)
            {
                canRetrieveMoreBatches = false;
            }

            // Handle any special rules required before track processing begins
            if (playlistSpecialRuleFlags.has("genre"))
            {
                artistIdToGenresMap = await specialRules.getArtistIdToGenreMap(req, res, tracksInBatch, artistIdToGenresMap);
                tracksInBatch = await enrichment.enrichTrackWithGenres(tracksInBatch, artistIdToGenresMap);
            }

            // Process each track in the batch
            for (const trackInBatch of tracksInBatch)
            {
                // Ensure that this track should go into the playlist based on the rules
                let trackFollowsAllRules = true;
                for (const playlistRule of playlistRules)
                {
                    if (!playlistRule.function(trackInBatch, playlistRule.data, playlistRule.operator))
                    {
                        trackFollowsAllRules = false;
                        break;
                    }
                }

                // If the track breaks even one of the rules, skip it and move to the next track to check
                if (!trackFollowsAllRules)
                {
                    continue;
                }

                // Put the track in the list of tracks to go in the playlist and keep a running tally of how long the playlist is
                tracksInPlaylist.push(trackInBatch);
                const lastTrackAddedIndex = tracksInPlaylist.length - 1;
                timeOfTracksInPlaylistInMsec += getDurationFromSavedTrack(trackInBatch);

                // Figure out where this track should be ordered in the playlist
                if (playlistOrderData.enabled)
                {
                    trackOrderingInPlaylist = getOrderForTracks(lastTrackAddedIndex, tracksInPlaylist, trackOrderingInPlaylist, playlistOrderData.comparisonFunction);
                }
                else
                {
                    // If order does not matter, just add the track to the end of the list
                    trackOrderingInPlaylist.push(lastTrackAddedIndex);
                }

                // If this is a playlist preview, we want to get the first set of songs that satisfy the requirements quickly
                // We want to be conscious of processing time, so we do not need to get all the songs in the library to create the playlist yet
                // Thus, we can just stop grabbing new batches and processing tracks once we have reached the desired limit
                if (isPlaylistPreview && tracksInPlaylist.length >= playlistPreviewLimit)
                {
                    // Will break out of the batch processing loop
                    canRetrieveMoreBatches = false;

                    // Breaks out of the track processing loop for a single batch
                    break;
                }
            }
        }

        // Filter the tracks in the playlist based on number of songs limit (if applicable)
        while (playlistLimitData.enabled && playlistLimitData.type === "songs" && trackOrderingInPlaylist.length > playlistLimitData.value)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            const trackIndexToRemoveBySongLimit = trackOrderingInPlaylist.pop();
            const trackToRemoveBySongLimit = tracksInPlaylist[trackIndexToRemoveBySongLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveBySongLimit);
            tracksInPlaylist[trackIndexToRemoveBySongLimit] = null;
        }

        // Filter the tracks in the playlist based on total time limit (if applicable)
        while (playlistLimitData.enabled && playlistLimitData.type === "milliseconds" && timeOfTracksInPlaylistInMsec > playlistLimitData.value)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            const trackIndexToRemoveByTimeLimit = trackOrderingInPlaylist.pop();
            const trackToRemoveByTimeLimit = tracksInPlaylist[trackIndexToRemoveByTimeLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveByTimeLimit);
            tracksInPlaylist[trackIndexToRemoveByTimeLimit] = null;
        }

        // Once we have an ordered list of all the tracks to use, shuffle around the track data to be in that order
        const orderedTracksInPlaylist = [];
        for (const trackIndex of trackOrderingInPlaylist)
        {
            orderedTracksInPlaylist.push(tracksInPlaylist[trackIndex]);
        }

        const smartPlaylistData = {
            limitData: playlistLimitData,
            orderData: playlistOrderData,
            trackData: orderedTracksInPlaylist
        };

        return Promise.resolve(smartPlaylistData);
    }
    catch (error)
    {
        logger.logError(`Failed to get smart playlist tracks: ${error.message}`);
        return Promise.reject(error);
    }
}

// Playlist Functions
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

function getPlaylistOrdering(req)
{
    // Default object to return if playlist ordering is disabled or errors arise
    const defaultPlaylistOrderData = {
        comparisonFunction: null,
        direction: null,
        enabled: false,
        field: null
    };

    // Create a new object to build and return (cannot use same object because of shallow references)
    const playlistOrderData = {
        ...defaultPlaylistOrderData
    };

    playlistOrderData.enabled = Boolean(req.body.playlistOrderEnabled);
    if (!playlistOrderData)
    {
        return defaultPlaylistOrderData;
    }

    playlistOrderData.field = req.body.playlistOrderField;
    switch (playlistOrderData.field)
    {
        case "artist":
        case "album":
        case "release date":
        case "duration":
        case "library add date":
        case "popularity":
        case "song":
            break;

        // If order field is not provided or value is unknown, disable ordering
        default:
            return defaultPlaylistOrderData;
    }

    playlistOrderData.direction = req.body.playlistOrderDirection;
    switch (playlistOrderData.direction)
    {
        case "descending":
        case "ascending":
            break;

        // If order direction is not provided or value is unknown, disable ordering
        default:
            return defaultPlaylistOrderData;
    }

    // After parsing all the inputs to ensure they are valid, now we can get a valid ordering function
    playlistOrderData.comparisonFunction = getOrderingFunction(playlistOrderData.field, playlistOrderData.direction);
    if (!playlistOrderData.comparisonFunction)
    {
        return defaultPlaylistOrderData;
    }

    return playlistOrderData;
}

function getPlaylistRules(req)
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

function getPlaylistDescription(playlistLimitData, playlistOrderData)
{
    let playlistDescription = playlistDescriptionPrefix;

    if (playlistLimitData.enabled)
    {
        playlistDescription += playlistDescriptionLimitPrefix + playlistDescriptionSpace +
            playlistLimitData.value + playlistDescriptionSpace +
            playlistLimitData.userSpecifiedType + playlistDescriptionPeriod + playlistDescriptionSpace;
    }

    if (playlistOrderData.enabled)
    {
        playlistDescription += playlistDescriptionOrderPrefix + playlistDescriptionSpace +
            playlistOrderData.field + playlistDescriptionSpace +
            playlistDescriptionIn + playlistDescriptionSpace +
            playlistOrderData.direction + playlistDescriptionSpace +
            playlistDescriptionOrder + playlistDescriptionPeriod + playlistDescriptionSpace;
    }

    return playlistDescription;
}

// Data Retrieval Functions
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

// Operator Functions
function equals(a, b)
{
    // If a is an array, we want to look for an exact match in the array only
    if (Array.isArray(a))
    {
        return a.includes(b);
    }

    // If a is a set, we want to look for an exact match of the values in the set only
    if (a instanceof Set)
    {
        return a.has(b);
    }

    // If a is an object, we want to look for an exact match of the values of the object only
    if (typeof a === "object")
    {
        return Object
            .values(a)
            .includes(b);
    }

    // Otherwise, check exact equivalence (for strings and numerics and the like)
    return a === b;
}

function notEquals(a, b)
{
    return !equals(a, b);
}

function greaterThan(a, b)
{
    return a > b;
}

function greaterThanOrEqualTo(a, b)
{
    return greaterThan(a, b) || equals(a, b);
}

function lessThan(a, b)
{
    return a < b;
}

function lessThanOrEqualTo(a, b)
{
    return lessThan(a, b) || equals(a, b);
}

// Note - The verb "contains" implies a lot of different possibilities
// This function means to address as many of them as possible
function contains(a, b, recurseDepth = 0)
{
    // Base case exits if a is null or undefined or otherwise falsy, or if recurse depth is too large
    if (!a || recurseDepth > maximumRecursionLimit)
    {
        return false;
    }

    // Check for complete equivalence first (in objects, sets, arrays, and primitives) using equals
    if (equals(a, b))
    {
        return true;
    }

    // Without complete equivalence, now we want to check partial equivalence
    if (typeof a === "string")
    {
        return a.includes(b);
    }

    // Check partial equivalence in array elements as well
    if (Array.isArray(a))
    {
        // When input does not have exact data name, try recursion for sub-strings and sub-arrays and sub-objects as applicable
        for (const elementOfA of a)
        {
            if (contains(elementOfA, b, recurseDepth + 1))
            {
                // Break if a positive result is found to prevent further processing
                return true;
            }
        }

        // If no result came back positive for the array, then the target does not exist within the array
        return false;
    }

    // No case above applies, so fall back to a negative default case
    return false;
}

function doesNotContain(a, b)
{
    return !contains(a, b);
}
