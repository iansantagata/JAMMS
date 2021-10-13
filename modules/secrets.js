"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
const logger = require(path.join(customModulePath, "logger.js"));
const environment = require(path.join(customModulePath, "environment.js"));

// Secrets Logic
exports.getBase64EncodedAuthorizationToken = async function()
{
    try
    {
        const clientId = await environment.getClientId();
        const clientSecret = await environment.getClientSecret();

        const authorizationString = `${clientId}:${clientSecret}`;
        const encodedBase64String = Buffer
            .from(authorizationString, "utf8")
            .toString("base64");

        return Promise.resolve(encodedBase64String);
    }
    catch (error)
    {
        logger.logError(`Failed to get base 64 encoded authorization token: ${error.message}`);
        return Promise.reject(error);
    }
};
