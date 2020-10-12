// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var playlist = require(path.join(customModulePath, 'playlist.js'));

// Home Logic
exports.getHomePage = function(req, res)
{
    // TODO - Update me (eventually) to be a full-fledged home page pointing to the various functionality of this app
    playlist.getAllUserPlaylists(req, res);
    res.send('Welcome home!');
};
