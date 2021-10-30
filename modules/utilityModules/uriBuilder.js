"use strict";

// Dependencies
const path = require("path"); // Uri and local file paths

// Utility Modules
const utilityModulesPath = __dirname;
const environment = require(path.join(utilityModulesPath, "environment.js"));

// Uri Builder Logic
exports.getUriWithPath = function(req, uriPath)
{
    const baseUri = exports.getBaseUri(req);
    const fullUri = `${baseUri}/${uriPath}`;
    return fullUri;
};

exports.getBaseUri = function(req)
{
    const scheme = getScheme();
    const hostName = getHostName(req);

    return `${scheme}://${hostName}`;
};

// Local Helper Functions
function getHostName(req)
{
    let hostName = req.hostname;
    if (!hostName)
    {
        // Replace the host name while developing via localhost in non-Production environments
        hostName = "localhost";
    }

    return hostName;
}

function getScheme()
{
    const isProductionEnvironment = environment.isProductionEnvironmentSync();
    if (isProductionEnvironment)
    {
        return "https";
    }

    // Non-Production environments should use HTTP rather than HTTPS
    return "http";
}
