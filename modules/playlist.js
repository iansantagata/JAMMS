// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyPlaylistClient = require(path.join(customModulePath, 'spotifyPlaylistClient.js'));

// Playlist Logic
exports.getPlaylistPage = async function(req, res, next)
{
    // Grab single playlist data that the user has requested
    try
    {
        var spotifyResponse = await spotifyPlaylistClient.getSingleUserPlaylist(req, res);
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

    // Shove the playlist response data onto the home page for the user to interact with
    res.location('/playlist');
    res.render('playlist', playlistData);
};

// TODO - Add endpoints as seen on buttons in playlist.vash page
