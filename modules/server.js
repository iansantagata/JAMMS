// Dependencies
var path = require('path'); // URI and local file paths
var http = require('http'); // HTTP for web protocol communication
var https = require('https'); // HTTPS for secure web protocol communication

// Custom Modules
const customModulePath = __dirname;
var logger = require(path.join(customModulePath, 'logger.js'));
var ssl = require(path.join(customModulePath, 'ssl.js'));

// Server Logic
exports.startUpHttpServer = async function(app)
{
    try
    {
        var httpPort = await getHttpPort();
        logger.logInfo('Starting HTTP server');

        http.createServer(app)
            .listen(httpPort);

        logger.logInfo('Listening for HTTP requests on port: ' + httpPort);
    }
    catch (error)
    {
        logger.logError('Failed to startup HTTP server: ' + error.message);

        // Re-throw error after logging has taken place
        throw error;
    }
}

exports.startUpHttpsServer = async function(app)
{
    try
    {
        var httpsOptions = await ssl.getFullSslCredentials();
        var httpsPort = await getHttpsPort();
        logger.logInfo('Starting HTTPS server');

        https.createServer(httpsOptions, app)
            .listen(httpsPort);

        logger.logInfo('Listening for HTTPS requests on port: ' + httpsPort);
    }
    catch (error)
    {
        logger.logError('Failed to startup HTTPS server: ' + error.message);

        // Re-throw error after logging has taken place
        throw error;
    }
}

// Local Helper Functions
getHttpPort = function()
{
    try
    {
        var httpPort = process.env.HTTP_PORT;
        return Promise.resolve(httpPort);
    }
    catch (error)
    {
        logger.logError('Failed to find environment variable for HTTP port: ' + error.message);
        return Promise.reject(error);
    }
}

getHttpsPort = function()
{
    try
    {
        var httpsPort = process.env.HTTPS_PORT;
        return Promise.resolve(httpsPort);
    }
    catch (error)
    {
        logger.logError('Failed to find environment variable for HTTPS port: ' + error.message);
        return Promise.reject(error);
    }
}
