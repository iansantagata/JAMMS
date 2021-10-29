"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const environment = require(path.join(utilityModulesPath, "environment.js"));

// Redirect Logic
const validateLoginEndpoint = "/validateLogin";

exports.getValidateLoginRedirectUri = function(req)
{
    return getBaseUri(req) + validateLoginEndpoint;
};

// Local Helper Functions
function getBaseUri(req)
{
    let hostName = req.hostname;
    if (!hostName)
    {
        hostName = "localhost";
    }

    // Build the full Uri to work both in production and while developing via localhost
    const isProductionEnvironment = environment.isProductionEnvironmentSync();
    if (isProductionEnvironment)
    {
        return `https://${hostName}`;
    }

    // Non-Production environments should use HTTP rather than HTTPS
    return `http://${hostName}`;
}
