// Dependencies
var path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var logger = require(path.join(customModulePath, "logger.js"));
var environment = require(path.join(customModulePath, "environment.js"));

// Secrets Logic
exports.getBase64EncodedAuthorizationToken = async function()
{
    try
    {
        var clientId = await environment.getClientId();
        var clientSecret = await environment.getClientSecret();

        var authorizationString = clientId + ":" + clientSecret;
        var encodedBase64String = Buffer.from(authorizationString, "utf8").toString("base64");
        return Promise.resolve(encodedBase64String);
    }
    catch (error)
    {
        logger.logError("Failed to get base 64 encoded authorization token: " + error.message);
        return Promise.reject(error);
    }
};
