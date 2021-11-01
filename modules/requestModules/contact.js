"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const loginUtils = require(path.join(utilityModulesPath, "loginUtils.js"));
const errorUtils = require(path.join(utilityModulesPath, "errorUtils.js"));

// Contact Logic
exports.getContactPage = async function(req, res, next)
{
    try
    {
        // See if the user is already logged in to determine what to show them on the contact page
        const isUserLoggedIn = await loginUtils.isUserLoggedIn(req, res);

        const contactPageData = {
            isAwaitingLogin: !isUserLoggedIn
        };

        // Render the contact page that the user can interact with
        res.location("/contact");
        res.render("contact", contactPageData);
    }
    catch (error)
    {
        logger.logError(`Failed to get contact page: ${error.message}`);
        next(error);
    }
};

exports.sendContactEmail = async function(req, res)
{
    try
    {
        // TODO - send an email here

        // Send a success status code back to the user if the process was successful
        res.sendStatus(200);
    }
    catch (error)
    {
        logger.logError(`Failed to send contact email: ${error.message}`);
        errorUtils.handleAjaxError(res);
    }
}
