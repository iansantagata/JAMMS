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
    // TODO - Create the endpoint to create the smart playlist
}
