// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyClient = require(path.join(customModulePath, 'spotifyClient.js'));

// Smart Playlist Logic
exports.createSmartPlaylistPage = async function(req, res, next)
{
    // Simply show the user the page to create a new smart playlist
    res.location('/createSmartPlaylist');
    res.render('createSmartPlaylist');
}

exports.createSmartPlaylist = async function(req, res, next)
{
    // Create a new smart playlist based on the user's request parameters
    try
    {
        // First, process all of the rules and optional settings from the request
        // Playlist Limits
        var isPlaylistLimitEnabled = req.body.playlistLimitEnabled || null;
        if (isPlaylistLimitEnabled === undefined || isPlaylistLimitEnabled === null)
        {
            isPlaylistLimitEnabled = false;
        }
        else
        {
            isPlaylistLimitEnabled = true;
        }

        if (isPlaylistLimitEnabled)
        {
            var playlistLimitType = req.body.playlistLimitType || null;
            if (playlistLimitType === undefined || playlistLimitType === null)
            {
                isPlaylistLimitEnabled = false;
            }

            var playlistLimitValue = req.body.playlistLimitValue || null;
            if (playlistLimitValue === undefined || playlistLimitValue === null)
            {
                isPlaylistLimitEnabled = false;
            }

            if (playlistLimitValue <= 0)
            {
                var error = new Error('Playlist limit cannot be zero or negative: ' + playlistLimitValue);
                console.error('Invalid playlist limit: ' + error.message);
                return Promise.reject(error);
            }

            if (playlistLimitValue > 10000)
            {
                var error = new Error('Playlist limit cannot be greater than ten thousand: ' + playlistLimitValue);
                console.error('Invalid playlist limit: ' + error.message);
                return Promise.reject(error);
            }

            // Convert the value from its unit to milliseconds to be easier to work with (if applicable)
            if (playlistLimitType === "minutes")
            {
                playlistLimitValue = playlistLimitValue * 60 * 1000;
                playlistLimitType = "milliseconds";
            }
            else if (playlistLimitType === "hours")
            {
                 playlistLimitValue = playlistLimitValue * 60 * 60 * 1000;
                 playlistLimitType = "milliseconds";
            }
        }

        // Playlist Ordering
        var isPlaylistOrderEnabled = req.body.playlistOrderEnabled || null;
        if (isPlaylistOrderEnabled === undefined || isPlaylistOrderEnabled === null)
        {
            isPlaylistOrderEnabled = false;
        }
        else
        {
            isPlaylistOrderEnabled = true;
        }

        if (isPlaylistOrderEnabled)
        {
            var playlistOrderField = req.body.playlistOrderField || null;
            if (playlistOrderField === undefined || playlistOrderField === null)
            {
                isPlaylistOrderEnabled = false;
            }

            var playlistOrderDirection = req.body.playlistOrderDirection || null;
            if (playlistOrderDirection === undefined || playlistOrderDirection === null)
            {
                isPlaylistOrderEnabled = false;
            }

            var orderComparisonFunction = getOrderingFunction(playlistOrderField, playlistOrderDirection);
        }

        // Playlist Rules
        var rules = [];
        var parsedRules = [];

        for (var parameter in req.body)
        {
            if (parameter.startsWith("playlistRule"))
            {
                var parameterSplit = parameter.split("-");
                var ruleNumber = parameterSplit[parameterSplit.length - 1];

                if (!parsedRules.includes(ruleNumber))
                {
                    var ruleType = req.body["playlistRuleType-" + ruleNumber];
                    var ruleOperator = req.body["playlistRuleOperator-" + ruleNumber];
                    var ruleData = req.body["playlistRuleData-" + ruleNumber];

                    var ruleOperatorFunction = getRuleOperatorFunction(ruleOperator);
                    var ruleFunction = getRuleFunction(ruleType);

                    var ruleFromParameters =
                    {
                        function: ruleFunction,
                        operator: ruleOperatorFunction,
                        data: ruleData
                    };

                    rules.push(ruleFromParameters);
                    parsedRules.push(ruleNumber);
                }
            }
        }

        // Keep track of the tracks to be in the playlist and the order of them as well
        var tracksInPlaylist = [];
        var trackOrderingInPlaylist = [];
        var timeOfTracksInPlaylistInMsec = 0;
        var existMoreBatchesToRetrieve = true;

        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = 50; // Maximum value of tracks to retrieve per page

        // Loop over all songs in the library in batches
        // TODO - Make the song retrieval area configurable (library, playlist, etc)
        while (existMoreBatchesToRetrieve)
        {
            // Get all the tracks in this batch
            var getAllTracksBatchedResponse = await spotifyClient.getAllTracks(req, res);

            // Get data on the tracks processed
            var tracksProcessed = getAllTracksBatchedResponse.offset + getAllTracksBatchedResponse.limit;
            var totalTracks = getAllTracksBatchedResponse.total;

            // Increment the page number to retrieve the next batch of tracks when ready
            req.query.pageNumber++;

            // If there are no more tracks to retrieve from the library after these ones, mark that so we do not continue endlessly
            if (tracksProcessed >= totalTracks)
            {
                existMoreBatchesToRetrieve = false;
            }

            // Process each track in the batch
            var tracksInBatch = getAllTracksBatchedResponse.items;
            for (var trackInBatch of tracksInBatch)
            {
                // Ensure that this track should go into the playlist based on the rules
                var trackFollowsAllRules = true;
                for (var rule of rules)
                {
                    // TODO - Figure out a way to make AND and OR rules work here
                    if (!rule.function(trackInBatch, rule.data, rule.operator))
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
                var lastTrackAddedIndex = tracksInPlaylist.length - 1;
                timeOfTracksInPlaylistInMsec += getDurationFromSavedTrack(trackInBatch);

                // Figure out where this track should be ordered in the playlist
                if (isPlaylistOrderEnabled)
                {
                    trackOrderingInPlaylist = getOrderForTracks(lastTrackAddedIndex, tracksInPlaylist, trackOrderingInPlaylist, orderComparisonFunction);
                }
                else
                {
                    // If order does not matter, just add the track to the end of the list
                    trackOrderingInPlaylist.push(lastTrackAddedIndex);
                }
            }
        }

        // Filter the tracks in the playlist based on number of songs limit (if applicable)
        while (isPlaylistLimitEnabled && playlistLimitType === "songs" && trackOrderingInPlaylist.length > playlistLimitValue)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            var trackIndexToRemoveBySongLimit = trackOrderingInPlaylist.pop();
            var trackToRemoveBySongLimit = tracksInPlaylist[trackIndexToRemoveBySongLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveBySongLimit);
            tracksInPlaylist[trackIndexToRemoveBySongLimit] = undefined;
        }

        // Filter the tracks in the playlist based on total time limit (if applicable)
        while (isPlaylistLimitEnabled && playlistLimitType === "milliseconds" && timeOfTracksInPlaylistInMsec > playlistLimitValue)
        {
            // If we have to remove something, it should be the last track in the list based on ordering
            var trackIndexToRemoveByTimeLimit = trackOrderingInPlaylist.pop();
            var trackToRemoveByTimeLimit = tracksInPlaylist[trackIndexToRemoveByTimeLimit];
            timeOfTracksInPlaylistInMsec -= getDurationFromSavedTrack(trackToRemoveByTimeLimit);
            tracksInPlaylist[trackIndexToRemoveByTimeLimit] = undefined;
        }

        // Once we have an ordered list of all the tracks to use, shuffle around the track data to be in that order
        var orderedTracksInPlaylist = [];
        for (var trackIndex of trackOrderingInPlaylist)
        {
            orderedTracksInPlaylist.push(tracksInPlaylist[trackIndex]);
        }

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);

        // For visibility purposes, prepend the name of the smart playlist with the app name
        req.body.playlistName = "JAMMS: " + req.body.playlistName;
        var createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        var playlistId = createPlaylistResponse.id;
        req.body.playlistId = playlistId;
        req.body.trackUris = orderedTracksInPlaylist.map(getUriFromSavedTrack);
        var addTracksToPlaylistResponse = await spotifyClient.addTracksToPlaylist(req, res);

        // Finally, we want to show the user info about their new playlist, so retrieve that data after songs were inserted
        // TODO - Consider the possibility of splitting up previewing the songs to be on a playlist (in a table) before creating it
        req.query.playlistId = playlistId;
        var getPlaylistResponse = await spotifyClient.getSinglePlaylist(req, res);
    }
    catch (error)
    {
        next(error);
        return;
    }

    var playlistData = {
        playlistId: getPlaylistResponse.id,
        playlistName: getPlaylistResponse.name,
        playlistDescription: getPlaylistResponse.description,
        isCollaborative: getPlaylistResponse.collaborative,
        isPublic: getPlaylistResponse.public,
        followersCount: getPlaylistResponse.followers.total,
        trackCount: getPlaylistResponse.tracks.total,
        images: getPlaylistResponse.images,
        deleted: false
    };

    // Shove the playlist response data onto the playlist page for the user to interact with
    res.location('/playlist');
    res.render('viewPlaylist', playlistData);
}

// Local Helper Functions

// Data Retrieval Functions
getUriFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.uri;
}

getTrackNameFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.name.toUpperCase();
}

getAlbumNameFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.album.name.toUpperCase();
}

getArtistsFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.artists;
}

getArtistNamesFromSavedTrack = function(savedTrack)
{
    // A track can have multiple artists and is usually in a particular order
    // Take all the artists on a track and join them into a single comma separated string
    return getArtistsFromSavedTrack(savedTrack).map(getArtistNameFromArtist).join(", ");
}

getReleaseDateFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.album.release_date;
}

getReleaseYearFromSavedTrack = function(savedTrack)
{
    // The release year is usually YYYY-MM-DD but can optionally have month or day level precision
    // Grab the first four characters present to get the year value only as it should always be present
    return getReleaseDateFromSavedTrack(savedTrack).substr(0, 4);
}

getAddDateFromSavedTrack = function(savedTrack)
{
    return savedTrack.added_at;
}

getDurationFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.duration_ms;
}

getPopularityFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.popularity;
}

getArtistNameFromArtist = function(artist)
{
    return artist.name.toUpperCase();
}

// Operator Functions
equals = function(target, existing)
{
    return target === existing;
}

notEquals = function(target, existing)
{
    return target !== existing;
}

greaterThan = function(target, existing)
{
    return target > existing;
}

greaterThanOrEqualTo = function(target, existing)
{
    return greaterThan(target, existing) || equals(target, existing);
}

lessThan = function(target, existing)
{
    return target < existing;
}

lessThanOrEqualTo = function(target, existing)
{
    return lessThan(target, existing) || equals(target, existing);
}

// TODO - Contains logic

// Rule Functions
ruleBySongName = function(track, songNameRuleData, operatorFunction)
{
    var trackSongName = getTrackNameFromSavedTrack(track);
    return operatorFunction(trackSongName, songNameRuleData.toUpperCase());
}

ruleByAlbumName = function(track, albumNameRuleData, operatorFunction)
{
    var trackAlbumName = getAlbumNameFromSavedTrack(track);
    return operatorFunction(trackAlbumName, albumNameRuleData.toUpperCase());
}

ruleByReleaseYear = function(track, releaseYearRuleData, operatorFunction)
{
    var trackReleaseYear = getReleaseYearFromSavedTrack(track);
    return operatorFunction(trackReleaseYear, releaseYearRuleData);
}

ruleByArtistName = function(track, artistNameRuleData, operatorFunction)
{
    var trackArtistName = getArtistNamesFromSavedTrack(track);
    return operatorFunction(trackArtistName, artistNameRuleData.toUpperCase());
}

// TODO - Rule for genre

getRuleOperatorFunction = function(operator)
{
    var operatorFunction = () => {};

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
            // TODO - Create a contains function
            break;
        case "equal":
        default:
            operatorFunction = equals;
            break;
    }

    return operatorFunction;
}

getRuleFunction = function(ruleType)
{
    var ruleFunction = () => {};

    switch (ruleType)
    {
        case "artist":
            ruleFunction = ruleByArtistName;
            break;
        case "album":
            ruleFunction = ruleByAlbumName;
            break;
        case "genre":
            // TODO - Rule by genre function
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
getOrderForTracks = function(targetTrackIndex, tracks, orderOfTracks, orderComparisonFunction)
{
    if (orderOfTracks === undefined || orderOfTracks === null || !Array.isArray(orderOfTracks))
    {
        return [];
    }

    if (targetTrackIndex === undefined || targetTrackIndex === null || typeof(targetTrackIndex) !== "number")
    {
        return orderOfTracks;
    }

    if (tracks === undefined || tracks === null || !Array.isArray(tracks) || tracks.length <= 0)
    {
        return orderOfTracks;
    }

    if (orderComparisonFunction === undefined || orderComparisonFunction === null || typeof(orderComparisonFunction) !== "function")
    {
        return orderOfTracks;
    }

    // Figure out where this track goes in the existing ordering
    var targetOrderIndex = 0;
    var lowerBoundInclusive = 0;
    var upperBoundExclusive = orderOfTracks.length;
    var trackToInsert = tracks[targetTrackIndex];

    // Converge on the location to insert by moving the bounds until they are equal
    while (lowerBoundInclusive !== upperBoundExclusive)
    {
        // Grab the closest approximation to the middle index in the remaining bounded range
        // This is done in order to shrink the search space and use O(log(n)) instead of O(n)
        targetOrderIndex = upperBoundExclusive - 1 - Math.floor((upperBoundExclusive - lowerBoundInclusive) / 2);

        // Use the order index to retrieve the target track
        var targetTrack = tracks[orderOfTracks[targetOrderIndex]];

        // Compare the track to be inserted against the track at the current index
        var comparisonResult = orderComparisonFunction(trackToInsert, targetTrack);

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

getOrderingFunction = function(orderField, orderDirection)
{
    var orderingFunction = () => {};

    switch (orderField)
    {
        case "artist":
            orderingFunction = getOrderingFunctionByDirection(compareByArtistAscending, compareByArtistDescending, orderDirection);
            break;
        case "album":
            orderingFunction = getOrderingFunctionByDirection(compareByAlbumAscending, compareByAlbumDescending, orderDirection);
            break;
        case "release":
            orderingFunction = getOrderingFunctionByDirection(compareByReleaseAscending, compareByReleaseDescending, orderDirection);
            break;
        case "duration":
            orderingFunction = getOrderingFunctionByDirection(compareByDurationAscending, compareByDurationDescending, orderDirection);
            break;
        case "library":
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

getOrderingFunctionByDirection = function(ascendingFunction, descendingFunction, direction)
{
    var orderingFunctionByDirection = () => {};

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
compareBySongAscending = function(targetTrack, existingTrack)
{
    var targetTrackSongName = getTrackNameFromSavedTrack(targetTrack);
    var existingTrackSongName = getTrackNameFromSavedTrack(existingTrack);

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

compareBySongDescending = function(targetTrack, existingTrack)
{
    var targetTrackSongName = getTrackNameFromSavedTrack(targetTrack);
    var existingTrackSongName = getTrackNameFromSavedTrack(existingTrack);

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

compareByLibraryAscending = function(targetTrack, existingTrack)
{
    var targetTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(targetTrack);
    var existingTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(existingTrack);

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

compareByLibraryDescending = function(targetTrack, existingTrack)
{
    var targetTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(targetTrack);
    var existingTrackLibraryAddTimeStamp = getAddDateFromSavedTrack(existingTrack);

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

compareByAlbumAscending = function(targetTrack, existingTrack)
{
    var targetTrackAlbumName = getAlbumNameFromSavedTrack(targetTrack);
    var existingTrackAlbumName = getAlbumNameFromSavedTrack(existingTrack);

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

compareByAlbumDescending = function(targetTrack, existingTrack)
{
    var targetTrackAlbumName = getAlbumNameFromSavedTrack(targetTrack);
    var existingTrackAlbumName = getAlbumNameFromSavedTrack(existingTrack);

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

compareByReleaseAscending = function(targetTrack, existingTrack)
{
    var targetTrackReleaseDate = getReleaseDateFromSavedTrack(targetTrack);
    var existingTrackReleaseDate = getReleaseDateFromSavedTrack(existingTrack);

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

compareByReleaseDescending = function(targetTrack, existingTrack)
{
    var targetTrackReleaseDate = getReleaseDateFromSavedTrack(targetTrack);
    var existingTrackReleaseDate = getReleaseDateFromSavedTrack(existingTrack);

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

compareByArtistAscending = function(targetTrack, existingTrack)
{
    var targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack);
    var existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack);

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

compareByArtistDescending = function(targetTrack, existingTrack)
{
    var targetTrackArtists = getArtistNamesFromSavedTrack(targetTrack);
    var existingTrackArtists = getArtistNamesFromSavedTrack(existingTrack);

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

compareByDurationAscending = function(targetTrack, existingTrack)
{
    var targetTrackDuration = getDurationFromSavedTrack(targetTrack);
    var existingTrackDuration = getDurationFromSavedTrack(existingTrack);

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

compareByDurationDescending = function(targetTrack, existingTrack)
{
    var targetTrackDuration = getDurationFromSavedTrack(targetTrack);
    var existingTrackDuration = getDurationFromSavedTrack(existingTrack);

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

compareByPopularityAscending = function(targetTrack, existingTrack)
{
    var targetTrackPopularity = getPopularityFromSavedTrack(targetTrack);
    var existingTrackPopularity = getPopularityFromSavedTrack(existingTrack);

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

compareByPopularityDescending = function(targetTrack, existingTrack)
{
    var targetTrackPopularity = getPopularityFromSavedTrack(targetTrack);
    var existingTrackPopularity = getPopularityFromSavedTrack(existingTrack);

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
