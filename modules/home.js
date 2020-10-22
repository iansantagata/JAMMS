// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var spotifyClient = require(path.join(customModulePath, 'spotifyClient.js'));

// Home Logic
exports.getHomePage = async function(req, res, next)
{
    // We want a broad overlook of data for the home page, showing users all of their data at a glance
    try
    {
        var spotifyResponse = await spotifyClient.getUserData(req, res);
    }
    catch (error)
    {
        next(error);
        return;
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

    // Shove the playlist response data onto the home page for the user to interact with
    res.location('/home');
    res.render('home', homePageData);
};
