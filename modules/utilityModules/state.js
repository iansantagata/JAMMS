"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = __dirname;
const logger = require(path.join(utilityModulesPath, "logger.js"));
const cookie = require(path.join(utilityModulesPath, "cookie.js"));
const random = require(path.join(utilityModulesPath, "random.js"));

// Default Constant Values
const stateKey = "SpotifyAuthorizationState";
const stateLength = 16;

// State Logic
exports.generateStateToken = function()
{
    try
    {
        const stateToken = random.generateRandomString(stateLength);
        return Promise.resolve(stateToken);
    }
    catch (error)
    {
        logger.logError(`Failed to generate state token: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getStateToken = async function(req)
{
    try
    {
        const stateToken = await cookie.getCookie(req, stateKey);
        return Promise.resolve(stateToken);
    }
    catch (error)
    {
        logger.logError(`Failed to get state token: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.setStateToken = function(req, res, stateToken)
{
    try
    {
        cookie.setCookie(req, res, stateKey, stateToken); // Session cookie (no explicit expiration)
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to set state token: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.clearStateToken = async function(res)
{
    try
    {
        await cookie.clearCookie(res, stateKey);
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to clear state token: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.validateStateTokenMatch = async function(req)
{
    try
    {
        const stateToken = req.query.state;
        if (!stateToken)
        {
            throw new Error("Failed to find state token in request object");
        }

        const storedStateToken = await exports.getStateToken(req);
        if (stateToken !== storedStateToken)
        {
            throw new Error("Failed to match state token of browser to Spotify state token");
        }

        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to validate state token match: ${error.message}`);
        return Promise.reject(error);
    }
};
