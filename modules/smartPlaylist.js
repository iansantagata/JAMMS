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
                var error = new Error('Invalid playlist limit value; Value cannot zero or negative: ' + playlistLimitValue);
                console.error(error.message);
                return Promise.reject(error);
            }

            if (playlistLimitValue > 10000)
            {
                var error = new Error('Invalid playlist limit value; Value cannot be greater than ten thousand: ' + playlistLimitValue);
                console.error(error.message);
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

            if (playlistOrderDirection !== "ascending" && playlistOrderDirection !== "descending")
            {
                var error = new Error('Invalid playlist order by direction; Valid values are "ascending" or "descending" only: ' + playlistOrderDirection);
                console.error(error.message);
                return Promise.reject(error);
            }

            var orderComparisonFunction = getOrderingFunction(playlistOrderField, playlistOrderDirection);
        }

        // TODO - Add functions of rules to this array to evaluate each one for a song
        var rules = [];

        var tracksInPlaylist = [];
        var trackOrderingInPlaylist = [];

        // TODO - While there are still batches of songs to grab:
        // TODO - Grab a batch of 50 songs
        // TODO - Foreach song in a batch:
        // TODO - 1. Validate it fits all the rules, if not then continue
        // TODO - 2. Insert it in order into the list of applicable songs (if ordering applies)
        // TODO - 3. Trim the list of applicable songs by limit criteria (if limiting applies)

        // TODO - Looping over batches
        req.query.pageNumber = 1; // Start with first page
        req.query.tracksPerPage = 50; // Maximum value of tracks to retrieve per page
        var getAllTracksBatchedResponse = await spotifyClient.getAllTracks(req, res);

        var timeOfTracksInPlaylistInMsec = 0;
        var tracksInBatch = getAllTracksBatchedResponse.items;
        tracksInBatch.forEach((trackInBatch) => {

            // TODO - Rule Checking
            // TODO - Figure out a way to make AND and OR rules work here
            tracksInPlaylist.push(trackInBatch);
            var lastTrackAddedIndex = tracksInPlaylist.length - 1;
            timeOfTracksInPlaylistInMsec += trackInBatch.track.duration_ms;

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

            // Filter the tracks in the playlist based on number of songs limit (if applicable)
            if (isPlaylistLimitEnabled && playlistLimitType === "songs" && tracksInPlaylist.length > playlistLimitValue)
            {
                // If we have to remove something, it should be the last track in the list based on ordering
                var trackIndexToRemoveBySongLimit = trackOrderingInPlaylist.pop();
                tracksInPlaylist[trackIndexToRemoveBySongLimit] = undefined;
                timeOfTracksInPlaylistInMsec -= trackInBatch.track.duration_ms;
            }

            // Filter the tracks in the playlist based on total time limit (if applicable)
            if (isPlaylistLimitEnabled && playlistLimitType === "milliseconds" && timeOfTracksInPlaylistInMsec > playlistLimitValue)
            {
                // If we have to remove something, it should be the last track in the list based on ordering
                var trackIndexToRemoveByTimeLimit = trackOrderingInPlaylist.pop();
                tracksInPlaylist[trackIndexToRemoveByTimeLimit] = undefined;
                timeOfTracksInPlaylistInMsec -= trackInBatch.track.duration_ms;

                // TODO - It's entirely possible that the last song added was a very long song added in the middle of the order (or just not last) and removing the last doesn't get us below the time limit again.
                // TODO - Revisit this limit and validate it works with ordering properly.
                // TODO - May have to apply limitations after all ordering has taken place.
            }
        });

        // Once we have an ordered list of all the tracks to use, shuffle around the track data to be in that order
        var orderedTracksInPlaylist = [];
        for (var trackIndex of trackOrderingInPlaylist)
        {
            orderedTracksInPlaylist.push(tracksInPlaylist[trackIndex]);
        }

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);
        var createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        var playlistId = createPlaylistResponse.id;
        req.body.playlistId = playlistId;
        req.body.trackUris = orderedTracksInPlaylist.map(getUriFromSavedTrack);
        var addTracksToPlaylistResponse = await spotifyClient.addTracksToPlaylist(req, res);

        // Finally, we want to show the user info about their new playlist, so retrieve that data after songs were inserted
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
getUriFromSavedTrack = function(savedTrack)
{
    return savedTrack.track.uri;
}

getArtistNameFromArtist = function(artist)
{
    return artist.name.toUpperCase();
}

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
        case "songPopularity":
            orderingFunction = getOrderingFunctionByDirection(compareByTrackPopularityAscending, compareByTrackPopularityDescending, orderDirection);
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
    var targetTrackSongName = targetTrack.track.name.toUpperCase();
    var existingTrackSongName = existingTrack.track.name.toUpperCase();

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
    var targetTrackSongName = targetTrack.track.name.toUpperCase();
    var existingTrackSongName = existingTrack.track.name.toUpperCase();

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
    var targetTrackLibraryAddTimeStamp = targetTrack.added_at;
    var existingTrackLibraryAddTimeStamp = existingTrack.added_at;

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
    var targetTrackLibraryAddTimeStamp = targetTrack.added_at;
    var existingTrackLibraryAddTimeStamp = existingTrack.added_at;

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
    var targetTrackAlbumName = targetTrack.track.album.name.toUpperCase();
    var existingTrackAlbumName = existingTrack.track.album.name.toUpperCase();

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
    var targetTrackAlbumName = targetTrack.track.album.name.toUpperCase();
    var existingTrackAlbumName = existingTrack.track.album.name.toUpperCase();

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
    var targetTrackReleaseDate = targetTrack.track.album.release_date;
    var existingTrackReleaseDate = existingTrack.track.album.release_date;

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
    var targetTrackReleaseDate = targetTrack.track.album.release_date;
    var existingTrackReleaseDate = existingTrack.track.album.release_date;

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
    // A track can have multiple artists and is usually in a particular order
    // Take all the artists on a track and join them into a comma separated string for comparison
    var targetTrackArtists = targetTrack.track.artists.map(getArtistNameFromArtist).join(", ");
    var existingTrackArtists = existingTrack.track.artists.map(getArtistNameFromArtist).join(", ");

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
    // A track can have multiple artists and is usually in a particular order
    // Take all the artists on a track and join them into a comma separated string for comparison
    var targetTrackArtists = targetTrack.track.artists.map(getArtistNameFromArtist).join(", ");
    var existingTrackArtists = existingTrack.track.artists.map(getArtistNameFromArtist).join(", ");

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
    var targetTrackDuration = targetTrack.track.duration_ms;
    var existingTrackDuration = existingTrack.track.duration_ms;

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
    var targetTrackDuration = targetTrack.track.duration_ms;
    var existingTrackDuration = existingTrack.track.duration_ms;

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

compareByTrackPopularityAscending = function(targetTrack, existingTrack)
{
    var targetTrackPopularity = targetTrack.track.popularity;
    var existingTrackPopularity = existingTrack.track.popularity;

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

compareByTrackPopularityDescending = function(targetTrack, existingTrack)
{
    var targetTrackPopularity = targetTrack.track.popularity;
    var existingTrackPopularity = existingTrack.track.popularity;

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
