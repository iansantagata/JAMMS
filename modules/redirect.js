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
    // TODO - Make this https when in production and http when in development
    console.error('The callback URL is: ' + req.protocol + '://' + hostName);
    console.error('The callback is secure: ' + req.secure);
    return req.protocol + '://' + hostName;
}
