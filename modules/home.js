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
