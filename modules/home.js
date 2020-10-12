// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var playlist = require(path.join(customModulePath, 'playlist.js'));

// Home Logic
exports.getHomePage = function(req, res, next)
{
    var spotifyResponse = playlist.getAllUserPlaylists(req, res);
    if(!spotifyResponse.isValidResponse)
    {
        // TODO - There has to be a better way to handle this issue and still show the user something...
        next(spotifyResponse.errorMessage);
        return;
    }

    // TODO - Update me (eventually) to be a full-fledged home page pointing to the various functionality of this app
    res.send('Welcome home!');
};
