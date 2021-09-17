// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyClient = require(path.join(customModulePath, 'spotifyClient.js'));
var logger = require(path.join(customModulePath, 'logger.js'));

// Home Logic
exports.getHomePage = async function(req, res, next)
{
    try
    {
        var homePageData = await exports.getHomePageData(req, res);
        exports.renderHomePage(res, homePageData);
    }
    catch (error)
    {
        logger.logError('Failed to get home page: ' + error.message);
        next(error);
        return;
    }
};

exports.getHomePageData = async function(req, res)
{
    // We want a broad overlook of data for the home page, showing users all of their data at a glance
    try
    {
        var spotifyResponse = await spotifyClient.getUserData(req, res);
    }
    catch (error)
    {
        logger.logError('Failed to get home page data: ' + error.message);
        return Promise.reject(error);
    }

    var homePageData = {
        numberOfPlaylists: spotifyResponse.numberOfPlaylists,
        samplePlaylistData: spotifyResponse.samplePlaylistData,
        numberOfArtists: spotifyResponse.numberOfArtists,
        sampleArtistData: spotifyResponse.sampleArtistData,
        numberOfTracks: spotifyResponse.numberOfTracks,
        sampleTrackData: spotifyResponse.sampleTrackData
    };

    return Promise.resolve(homePageData);
}

exports.renderHomePage = function(res, homePageData)
{
    // Shove the playlist response data onto the home page for the user to interact with
    res.location('/home');
    res.render('home', homePageData);
}
