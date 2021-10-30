"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = __dirname;
const logger = require(path.join(utilityModulesPath, "logger.js"));

// Encoding Logic
exports.encodeInBase64 = function(stringToEncode)
{
    try
    {
        return Promise.resolve(Buffer
            .from(stringToEncode, "utf8")
            .toString("base64"));
    }
    catch (error)
    {
        logger.logError(`Failed to base 64 encode string: ${stringToEncode}`);
        return Promise.reject(error);
    }
};
