"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const spotifyClient = require(path.join(utilityModulesPath, "spotifyClient.js"));

// Home Logic
exports.getHomePage = async function(req, res, next)
{
    try
    {
        const homePageData = await exports.getHomePageData(req, res);
        exports.renderHomePage(res, homePageData);
    }
    catch (error)
    {
        logger.logError(`Failed to get home page: ${error.message}`);
        next(error);
    }
};

exports.getHomePageData = async function(req, res)
{
    // We want a broad overlook of data for the home page, showing users all of their data at a glance
    try
    {
        const spotifyResponse = await spotifyClient.getUserData(req, res);

        const homePageData = {
            numberOfArtists: spotifyResponse.numberOfArtists,
            numberOfPlaylists: spotifyResponse.numberOfPlaylists,
            numberOfTracks: spotifyResponse.numberOfTracks,
            sampleArtistData: spotifyResponse.sampleArtistData,
            samplePlaylistData: spotifyResponse.samplePlaylistData,
            sampleTrackData: spotifyResponse.sampleTrackData
        };

        return Promise.resolve(homePageData);
    }
    catch (error)
    {
        logger.logError(`Failed to get home page data: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.renderHomePage = function(res, homePageData)
{
    // Shove the playlist response data onto the home page for the user to interact with
    res.location("/home");
    res.render("home", homePageData);
};
