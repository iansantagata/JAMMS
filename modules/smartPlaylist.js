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
        }

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

            // TODO - Ordering
            if (!isPlaylistOrderEnabled)
            {
                trackOrderingInPlaylist.push(lastTrackAddedIndex);
            }
            else
            {
                // Figure out where this track should be ordered in the playlist
            }

            // Filter the tracks in the playlist based on number of songs limit (if applicable)
            if (isPlaylistLimitEnabled && playlistLimitType === "songs" && tracksInPlaylist.length > playlistLimitValue)
            {
                var trackIndexToRemoveBySongLimit = trackOrderingInPlaylist.pop();
                tracksInPlaylist[trackIndexToRemoveBySongLimit] = undefined;
                timeOfTracksInPlaylistInMsec -= trackInBatch.track.duration_ms;
            }

            // Filter the tracks in the playlist based on total time limit (if applicable)
            if (isPlaylistLimitEnabled && playlistLimitType === "milliseconds" && timeOfTracksInPlaylistInMsec > playlistLimitValue)
            {
                var trackIndexToRemoveByTimeLimit = trackOrderingInPlaylist.pop();
                tracksInPlaylist[trackIndexToRemoveByTimeLimit] = undefined;
                timeOfTracksInPlaylistInMsec -= trackInBatch.track.duration_ms;
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
