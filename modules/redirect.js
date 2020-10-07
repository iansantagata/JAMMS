// Redirect Logic
const validateLoginEndpoint = '/validateLogin';

exports.getBaseUri = function(req)
{
    var hostName = req.hostName;
    if (req.hostName === undefined)
    {
        hostName = 'localhost';
    }

    // Build the full Uri to work both in production and while developing via localhost
    return req.protocol + '://' + hostName;
}

exports.getValidateLoginRedirectUri = function(req)
{
    return this.getBaseUri(req) + validateLoginEndpoint;
};
