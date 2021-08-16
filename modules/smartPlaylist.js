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
    // Create a new playlist based on the user's request parameters
    try
    {
        // Only thing we do not have supplied from the user is their user ID
        // The app has to get their user ID first to attach this new playlist to their profile
        req.body.userId = await spotifyClient.getCurrentUserId(req, res);
        var spotifyResponse = await spotifyClient.createSinglePlaylist(req, res);

        // Now that we have created the playlist, we want to add songs to it based on the smart playlist rules
        // TODO - DO THIS

        // Finally, we want to show the user info about their new playlist, so retrieve that data after songs were inserted
        // TODO - DO THIS
    }
    catch (error)
    {
        next(error);
        return;
    }

    var playlistData = {
        playlistId: spotifyResponse.id,
        playlistName: spotifyResponse.name,
        playlistDescription: spotifyResponse.description,
        isCollaborative: spotifyResponse.collaborative,
        isPublic: spotifyResponse.public,
        followersCount: spotifyResponse.followers.total,
        trackCount: spotifyResponse.tracks.total,
        images: spotifyResponse.images,
        deleted: false
    };

    // Shove the playlist response data onto the playlist page for the user to interact with
    res.location('/playlist');
    res.render('viewPlaylist', playlistData);
}
