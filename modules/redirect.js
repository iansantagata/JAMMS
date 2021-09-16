// Redirect Logic
const validateLoginEndpoint = '/validateLogin';

exports.getValidateLoginRedirectUri = function(req)
{
    return getBaseUri(req) + validateLoginEndpoint;
};

exports.useHttpsRequests = function(req, res, next)
{
    if (req.protocol === 'http')
    {
        res.redirect(301, 'https://' + req.hostname + req.url);
    }

    next();
}

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
    return req.protocol + '://' + hostName;
}
