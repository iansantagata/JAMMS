// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var playlist = require(path.join(customModulePath, 'playlist.js'));

// Home Logic
exports.getHomePage = async function(req, res, next)
{
    // Grab all playlist data from the user to show them on the home page in case they want to edit their playlists
    try
    {
        var spotifyResponse = await playlist.getAllUserPlaylists(req, res);
    }
    catch (errorResponse)
    {
        next(spotifyResponse.errorMessage);
        return;
    }

    // TODO - Change me to utilize a template like Vash to fill in HTML with some data from Spotify!
    console.log(spotifyResponse);

    // TODO - Update me (eventually) to be a full-fledged home page pointing to the various functionality of this app
    res.render('home');
};
