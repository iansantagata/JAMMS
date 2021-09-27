// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var environment = require(path.join(customModulePath, 'environment.js'));

// Redirect Logic
const validateLoginEndpoint = '/validateLogin';

exports.getValidateLoginRedirectUri = function(req)
{
    return getBaseUri(req) + validateLoginEndpoint;
};

// Local Helper Functions
getBaseUri = function(req)
{
    var hostName = req.hostname;
    if (req.hostname === undefined)
    {
        hostName = 'localhost';
    }

    // Build the full Uri to work both in production and while developing via localhost
    var isProductionEnvironment = environment.isProductionEnvironmentSync();
    if (isProductionEnvironment)
    {
        return 'https://' + hostName;
    }

    // Non-Production environments should use HTTP rather than HTTPS
    return 'http://' + hostName;
}
