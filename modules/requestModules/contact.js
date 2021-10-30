"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));

// Contact Logic
exports.getContactPage = function(req, res, next)
{
    try
    {
        // Render the contact page that the user can interact with
        res.location("/contact");
        res.render("contact");
    }
    catch (error)
    {
        logger.logError(`Failed to get contact page: ${error.message}`);
        next(error);
    }
};
