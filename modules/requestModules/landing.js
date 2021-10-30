"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Request Modules
const requestModulesPath = __dirname;
const home = require(path.join(requestModulesPath, "home.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const loginUtils = require(path.join(utilityModulesPath, "loginUtils.js"));

// Landing Logic
exports.getLandingPage = async function(req, res, next)
{
    try
    {
        // Try to get the home page if the user is already logged in or can authenticate
        const isUserLoggedIn = await loginUtils.isUserLoggedIn(req, res);
        if (!isUserLoggedIn)
        {
            throw new Error("User is not logged in. Falling back to landing page.");
        }

        const homePageData = await home.getHomePageData(req, res);
        home.renderHomePage(res, homePageData);
    }
    catch (homePageError)
    {
        try
        {
            // If authentication fails or the user has not logged in yet, try to send them to the landing page
            const landingPageData = {
                isAwaitingLogin: true
            };

            res.location("/");
            res.render("landing", landingPageData);
        }
        catch (landingPageError)
        {
            logger.logError(`Failed to get home page from landing page: ${homePageError.message}`);
            logger.logError(`Failed to get landing page: ${landingPageError.message}`);
            next(landingPageError);
        }
    }
};
