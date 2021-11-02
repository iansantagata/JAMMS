"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const loginUtils = require(path.join(utilityModulesPath, "loginUtils.js"));

// FAQ Logic
exports.getFrequentlyAskedQuestionsPage = async function(req, res, next)
{
    try
    {
        // See if the user is already logged in to determine what to show them on the FAQ page
        const isUserLoggedIn = await loginUtils.isUserLoggedIn(req, res);

        const faqPageData = {
            isAwaitingLogin: !isUserLoggedIn
        };

        // Render the FAQ page that the user can interact with
        res.location("/faq");
        res.render("faq", faqPageData);
    }
    catch (error)
    {
        logger.logError(`Failed to get FAQ page: ${error.message}`);
        next(error);
    }
};
