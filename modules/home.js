// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyClient = require(path.join(customModulePath, 'spotifyClient.js'));
var authorize = require(path.join(customModulePath, 'authorize.js'));

// Home Logic
exports.getLandingPage = async function(req, res, next)
{
    try
    {
        // Try to get the home page if the user is already logged in or can authenticate
        await authorize.getAccessTokenFromCookies(req, res);
        var homePageData = await exports.getHomePageData(req, res);
        exports.renderHomePage(req, res, homePageData);
    }
    catch (error)
    {
        // If authentication fails or the user has not logged in yet, send them to the landing page
        res.location('/');
        res.render('landing');
    }
}

exports.getHomePage = async function(req, res, next)
{
    try
    {
        var homePageData = await exports.getHomePageData(req, res);
    }
    catch (error)
    {
        next(error)
        return;
    }

    exports.renderHomePage(req, res, homePageData);
};

exports.renderHomePage = function(req, res, homePageData)
{
    // Shove the playlist response data onto the home page for the user to interact with
    res.location('/home');
    res.render('home', homePageData);
}

exports.getHomePageData = async function(req, res)
{
    // We want a broad overlook of data for the home page, showing users all of their data at a glance
    try
    {
        var spotifyResponse = await spotifyClient.getUserData(req, res);
    }
    catch (error)
    {
        console.error('Home Page Data Error: ' + error.message);
        return Promise.reject(error);
    }

    var homePageData = {
        numberOfPlaylists: spotifyResponse.numberOfPlaylists,
        samplePlaylistData: spotifyResponse.samplePlaylistData,
        numberOfArtists: spotifyResponse.numberOfArtists,
        sampleArtistData: spotifyResponse.sampleArtistData,
        numberOfTracks: spotifyResponse.numberOfTracks,
        sampleTrackData: spotifyResponse.sampleTrackData,
        numberOfAlbums: spotifyResponse.numberOfAlbums,
        sampleAlbumData: spotifyResponse.sampleAlbumData
    };

    return Promise.resolve(homePageData);
}
