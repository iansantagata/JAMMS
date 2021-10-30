"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = __dirname;
const logger = require(path.join(utilityModulesPath, "logger.js"));
const uriBuilder = require(path.join(utilityModulesPath, "uriBuilder.js"));
const authorize = require(path.join(utilityModulesPath, "authorize.js"));

// Default Constant Values
const validateLoginEndpoint = "validateLogin";

// Login Utility Logic
exports.getValidateLoginRedirectUri = function(req)
{
    try
    {
        const validateLoginRedirectUri = uriBuilder.getUriWithPath(req, validateLoginEndpoint);
        return Promise.resolve(validateLoginRedirectUri);
    }
    catch (error)
    {
        logger.logError(`Failed to construct validate login URI: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.isUserLoggedIn = async function(req, res)
{
    try
    {
        await authorize.getRefreshTokenFromCookies(req);
        await authorize.getAccessToken(req, res);

        // If we have a valid refresh and access token (retrieving them did not throw an error), then a user can be considered logged in
        return Promise.resolve(true);
    }
    catch (error)
    {
        // User is not logged in if we failed to get their login tokens (can swallow errors here)
        return Promise.resolve(false);
    }
};
