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
    if (process.env.NODE_ENV === 'production')
    {
        return 'https://' + hostName;
    }
    else
    {
        return 'http://' + hostName;
    }
}
