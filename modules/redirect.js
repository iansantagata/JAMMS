// Redirect Logic
const validateLoginEndpoint = '/validateLogin';

exports.getBaseUri = function(req)
{
    var hostName = req.hostname;
    if (req.hostname === undefined)
    {
        hostName = 'localhost';
    }

    // Build the full Uri to work both in production and while developing via localhost
    // TODO - Make this https when in production and http when in development
    console.error('THIS IS THE PROTOCOL: ' + req.protocol);
    console.error('THIS IS THE HOST NAME:' + req.hostname);
    return req.protocol + '://' + hostName;
}

exports.getValidateLoginRedirectUri = function(req)
{
    return this.getBaseUri(req) + validateLoginEndpoint;
};
