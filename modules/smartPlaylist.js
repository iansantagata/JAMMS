"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
const spotifyClient = require(path.join(customModulePath, "spotifyClient.js"));
const logger = require(path.join(customModulePath, "logger.js"));

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

const artistGenreRetrievalLimit = 50;

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

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);

        // For visibility purposes, prepend the name of the smart playlist with the app name
        req.body.playlistName = playlistNamePrefix + req.body.playlistName;
        req.body.playlistDescription = getPlaylistDescription(smartPlaylistData.limitData, smartPlaylistData.orderData);
        const createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        const playlistId = createPlaylistResponse.id;
        req.body.playlistId = playlistId;
        req.body.trackUris = smartPlaylistData.trackData.map(getUriFromSavedTrack);
        await spotifyClient.addTracksToPlaylist(req, res);

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
        const playlistSpecialRuleFlags = getPlaylistSpecialRuleFlags(playlistRules);
        let artistIdToGenresMap = new Map();

        // Keep track of the tracks to be in the playlist and the order of them as well
        const tracksInPlaylist = [];
        let trackOrderingInPlaylist = [];
        let timeOfTracksInPlaylistInMsec = 0;
        let canRetrieveMoreBatches = true;

        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = tracksPerPageDefault; // Maximum value of tracks to retrieve per page

        // Loop over all songs in the library in batches
        // TODO - Make the song retrieval area configurable (library, playlist, etc)
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
                artistIdToGenresMap = await getArtistIdToGenreMap(req, res, tracksInBatch, artistIdToGenresMap);
                tracksInBatch = await enrichTrackWithGenres(tracksInBatch, artistIdToGenresMap);
            }

            // Process each track in the batch
            for (const trackInBatch of tracksInBatch)
            {
                // Ensure that this track should go into the playlist based on the rules
                let trackFollowsAllRules = true;
                for (const playlistRule of playlistRules)
                {
                    // TODO - Figure out a way to make AND and OR rules work here
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

function getPlaylistSpecialRuleFlags(rules)
{
    const flags = new Set();
    if (!Array.isArray(rules) || rules.length <= 0)
    {
        return flags;
    }

    // Loop through every rule to check if there are any special cases to account for
    for (const rule of rules)
    {
        if (rule.function === ruleByGenre)
        {
            flags.add("genre");
        }
    }

    return flags;
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
    // Take all the artists on a track and join them into a single comma separated string
    return getArtistsFromSavedTrack(savedTrack)
        .map(getArtistNameFromArtist)
        .join(", ");
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
    return a === b;
}

function notEquals(a, b)
{
    return a !== b;
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

// TODO - Change this so it's a few different things based on the case:
// TODO - 1. If A is an array, contains B as an element within A
// TODO - 2. If A is a string, contains a substring B within A
// TODO - 3. If A is an object, contains a value B within A
// TODO - 4. If A is a map, contains a key B within A
// TODO - 5. If A is undefined or null, return false (rather than throwing an error)
// TODO - 6. If A is an array and its elements A` are strings, contains a substring B within element A`
function contains(a, b)
{
    return a.includes(b);
}

// Rule Functions
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

// Ordering Functions
function getOrderForTracks(targetTrackIndex, tracks, orderOfTracks, orderComparisonFunction)
{
    if (!Array.isArray(orderOfTracks))
    {
        return [];
    }

    if (typeof targetTrackIndex !== "number" || isNaN(targetTrackIndex))
    {
        return orderOfTracks;
    }

    if (!Array.isArray(tracks) || tracks.length <= 0)
    {
        return orderOfTracks;
    }

    if (typeof orderComparisonFunction !== "function")
    {
        return orderOfTracks;
    }

    // Figure out where this track goes in the existing ordering
    let targetOrderIndex = 0;
    let lowerBoundInclusive = 0;
    let upperBoundExclusive = orderOfTracks.length;
    const trackToInsert = tracks[targetTrackIndex];

    // Converge on the location to insert by moving the bounds until they are equal
    while (lowerBoundInclusive !== upperBoundExclusive)
    {
        // Grab the closest approximation to the middle index in the remaining bounded range
        // This is done in order to shrink the search space and use O(log(n)) instead of O(n)
        targetOrderIndex = upperBoundExclusive - 1 - Math.floor((upperBoundExclusive - lowerBoundInclusive) / 2);

        // Use the order index to retrieve the target track
        const targetTrack = tracks[orderOfTracks[targetOrderIndex]];

        // Compare the track to be inserted against the track at the current index
        const comparisonResult = orderComparisonFunction(trackToInsert, targetTrack);

        // Track to insert should come in order before the target track
        if (comparisonResult < 0)
        {
            upperBoundExclusive = targetOrderIndex;
        }

        // Track to insert should come in order after the target track
        else if (comparisonResult > 0)
        {
            lowerBoundInclusive = targetOrderIndex + 1;
        }

        // Track to insert is equivalent in order to the target track
        else
        {
            lowerBoundInclusive = targetOrderIndex;
            upperBoundExclusive = targetOrderIndex;
        }
    }

    // Insert into the order array, pushing everything at the index (inclusive) back
    targetOrderIndex = lowerBoundInclusive;
    orderOfTracks.splice(targetOrderIndex, 0, targetTrackIndex);
    return orderOfTracks;
}

function getOrderingFunction(orderField, orderDirection)
{
    let orderingFunction = () => {};

    switch (orderField)
    {
        case "artist":
            orderingFunction = getOrderingFunctionByDirection(compareByArtistAscending, compareByArtistDescending, orderDirection);
            break;

        case "album":
            orderingFunction = getOrderingFunctionByDirection(compareByAlbumAscending, compareByAlbumDescending, orderDirection);
            break;

        case "release date":
            orderingFunction = getOrderingFunctionByDirection(compareByReleaseAscending, compareByReleaseDescending, orderDirection);
            break;

        case "duration":
            orderingFunction = getOrderingFunctionByDirection(compareByDurationAscending, compareByDurationDescending, orderDirection);
            break;

        case "library add date":
            orderingFunction = getOrderingFunctionByDirection(compareByLibraryAscending, compareByLibraryDescending, orderDirection);
            break;

        case "popularity":
            orderingFunction = getOrderingFunctionByDirection(compareByPopularityAscending, compareByPopularityDescending, orderDirection);
            break;

        case "song":
        default:
            orderingFunction = getOrderingFunctionByDirection(compareBySongAscending, compareBySongDescending, orderDirection);
            break;
    }

    return orderingFunction;
}

function getOrderingFunctionByDirection(ascendingFunction, descendingFunction, direction)
{
    let orderingFunctionByDirection = () => {};

    switch (direction)
    {
        case "descending":
            orderingFunctionByDirection = descendingFunction;
            break;

        case "ascending":
        default:
            orderingFunctionByDirection = ascendingFunction;
            break;
    }

    return orderingFunctionByDirection;
}

// Comparison Functions
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
    const targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack);
    const existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack);

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
    const targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack);
    const existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack);

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

// Special Rule Functions
async function getArtistIdToGenreMap(req, res, savedTracks, existingArtistIdToGenresMap)
{
    try
    {
        // First, get a set of all unique artist IDs that do not exist in our map already
        const unmappedArtistIds = new Set();
        for (const savedTrack of savedTracks)
        {
            // If we cannot find data about a track or artists for a song, just skip the track
            if (!savedTrack || !savedTrack.track || !savedTrack.track.artists)
            {
                continue;
            }

            for (const artist of savedTrack.track.artists)
            {
                // Look to see that the ID is present and valid and does not already exist in our map
                // If it does exist in the map, we can safely skip it (since we already know that artist's genres)
                if (artist.id && !existingArtistIdToGenresMap.has(artist.id))
                {
                    unmappedArtistIds.add(artist.id);
                }
            }
        }

        // If it turns out all of the artists we have are already mapped, then we can just return the existing map
        if (unmappedArtistIds.size <= 0)
        {
            return Promise.resolve(existingArtistIdToGenresMap);
        }

        // With a set of unique unmapped artist IDs, group them into chunks to get genre data for artists in batches
        const artistIds = Array.from(unmappedArtistIds);
        const artistIdChunks = getArrayChunks(artistIds, artistGenreRetrievalLimit);
        const artistIdToGenresMap = new Map();

        for (const artistIdChunk of artistIdChunks)
        {
            // Call out to Spotify to get genre information for not already mapped artist
            req.query.artistIds = artistIdChunk;
            const response = await spotifyClient.getMultipleArtists(req, res);
            if (!response || !response.artists)
            {
                throw new Error("Failed to get valid artists response data");
            }

            // Loop through all of the artists and their respective genres (likely multiple)
            // The result will be a set of unique non-duplicated genres
            for (const artist of response.artists)
            {
                if (!artist)
                {
                    continue;
                }

                const genresForArtist = [];
                for (const artistGenre of artist.genres)
                {
                    if (!artistGenre)
                    {
                        continue;
                    }

                    // Collect one genre at a time for the artist into an array
                    const upperCaseArtistGenre = artistGenre.toUpperCase();
                    genresForArtist.push(upperCaseArtistGenre);
                }

                // Add the genres array into the map corresponding to the artist ID
                artistIdToGenresMap.set(artist.id, genresForArtist);
            }
        }

        // Finally, take the artist IDs to genres we found with this run
        // Then add them to the existing map to return
        const updatedArtistIdToGenreMap = new Map([...existingArtistIdToGenresMap, ...artistIdToGenresMap]);
        return Promise.resolve(updatedArtistIdToGenreMap);
    }
    catch (error)
    {
        // If there is a problem with getting artist data, then a user's playlist request related to genre data cannot realistically succeed
        // Best to log the error and reject to avoid a situation where users are built an undesireable smart playlist
        logger.logError(`Failed to build artist to genres map: ${error.message}`);
        return Promise.reject(error);
    }
}

// Enrichment Functions
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

// Generic Functions
function getArrayChunks(inputArray, chunkSize)
{
    if (!Array.isArray(inputArray))
    {
        throw new Error("Cannot chunk a non-array input");
    }

    if (chunkSize <= 0)
    {
        throw new Error("Cannot chunk array input into chunks of size less than one");
    }

    if (inputArray.length === 0)
    {
        return inputArray;
    }

    const arrayInChunks = [];

    const inputLength = inputArray.length;
    let index = 0;

    while (index < inputLength)
    {
        const chunk = inputArray.slice(index, index + chunkSize);
        arrayInChunks.push(chunk);

        index += chunkSize;
    }

    return arrayInChunks;
}
