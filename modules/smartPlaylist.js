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
        var isPlaylistLimitEnabled = req.body.playlistLimitEnabled !== undefined;
        var playlistLimitValue = req.body.playlistLimitValue;
        var playlistLimitType = req.body.playlistLimitType;

        var isPlaylistOrderEnabled = req.body.playlistOrderEnabled !== undefined;
        var playlistOrderDirection = req.body.playlistOrderDirection;
        var playlistOrderField = req.body.playlistOrderField;

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
        var tracksInBatch = getAllTracksBatchedResponse.items;
        tracksInBatch.forEach((trackInBatch) => {

            // TODO - Rule Checking
            // TODO - Figure out a way to make AND and OR rules work here
            tracksInPlaylist.push(trackInBatch);
            // TODO - Ordering
            // TODO - Filtering
        });

        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);
        var createPlaylistResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add the valid songs to it based on the smart playlist rules
        var playlistId = createPlaylistResponse.id;
        req.body.playlistId = playlistId;
        req.body.trackUris = tracksInPlaylist.map((trackInPlaylist) => {
            return trackInPlaylist.track.uri;
        });
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
