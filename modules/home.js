// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyPlaylistClient = require(path.join(customModulePath, 'spotifyPlaylistClient.js'));

// Home Logic
exports.getHomePage = async function(req, res, next)
{
    // Grab all playlist data from the user to show them on the home page in case they want to edit their playlists
    try
    {
        var spotifyResponse = await spotifyPlaylistClient.getAllUserPlaylists(req, res);
    }
    catch (error)
    {
        next(error);
        return;
    }

    var numberOfPages = Math.ceil(spotifyResponse.total / spotifyResponse.limit);
    var currentPage = Math.floor((spotifyResponse.offset + spotifyResponse.limit) / spotifyResponse.limit);

    var homePageData = {
        currentPage: currentPage,
        numberOfPages: numberOfPages,
        numberOfPlaylistsPerPage: spotifyResponse.limit,
        totalNumberOfPlaylists: spotifyResponse.total,
        playlists: spotifyResponse.items
    };

    // Shove the playlist response data onto the home page for the user to interact with
    res.render('home', homePageData);
};
