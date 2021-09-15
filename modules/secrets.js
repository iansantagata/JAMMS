// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var logger = require(path.join(customModulePath, 'logger.js'));

// Secrets Logic
exports.getClientId = function()
{
    try
    {
        // Try to read from environment variables
        var clientIdEnvironmentVariable = process.env.CLIENT_ID;
        if (clientIdEnvironmentVariable === undefined || clientIdEnvironmentVariable === null)
        {
            throw new Error('Client ID not found in environment variables');
        }

        var trimmedClientId = clientIdEnvironmentVariable.trim();
        return Promise.resolve(trimmedClientId);
    }
    catch (error)
    {
        logger.logError('Failed to get client ID: ' + error.message);
        return Promise.reject(error);
    }
}

exports.getBase64EncodedAuthorizationToken = async function()
{
    try
    {
        var clientId = await exports.getClientId();
        var clientSecret = await getClientSecret();

        var authorizationString = clientId + ":" + clientSecret;
        return Buffer.from(authorizationString, 'utf8').toString('base64');
    }
    catch (error)
    {
        logger.logError('Failed to get base 64 encoded authorization token: ' + error.message);
        return Promise.reject(error);
    }
}

// Local Helper Functions
getClientSecret = function()
{
    try
    {
        // Try to read from environment variables first and fall back to fixed file secret if no environment variable exists
        var clientSecretEnvironmentVariable = process.env.CLIENT_SECRET;
        if (clientSecretEnvironmentVariable === undefined || clientSecretEnvironmentVariable === null)
        {
            throw new Error('Client secret not found in environment variables');
        }

        var trimmedClientSecret = clientSecretEnvironmentVariable.trim();
        return Promise.resolve(trimmedClientSecret);
    }
    catch (error)
    {
        logger.logError('Failed to get client secret: ' + error.message);
        return Promise.reject(error);
    }
}
