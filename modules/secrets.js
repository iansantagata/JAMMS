// Secrets Logic
exports.getClientId = function()
{
    try
    {
        // Try to read from environment variables
        var clientIdEnvironmentVariable = process.env.CLIENT_ID;
        if (clientIdEnvironmentVariable !== undefined && clientIdEnvironmentVariable !== null)
        {
            return clientIdEnvironmentVariable.trim();
        }

        return undefined;
    }
    catch (error)
    {
        console.error('Failed to get client ID: ' + error.message);
        return undefined;
    }
}

exports.getClientSecret = function()
{
    try
    {
        // Try to read from environment variables first and fall back to fixed file secret if no environment variable exists
        var clientSecretEnvironmentVariable = process.env.CLIENT_SECRET;
        if (clientSecretEnvironmentVariable !== undefined && clientSecretEnvironmentVariable !== null)
        {
            return clientSecretEnvironmentVariable.trim();
        }

        return undefined;
    }
    catch (error)
    {
        console.error('Failed to get client secret: ' + error.message);
        return undefined;
    }
}

exports.getBase64EncodedAuthorizationToken = function()
{
    var clientId = this.getClientId();
    var clientSecret = this.getClientSecret();

    if (clientId === undefined)
    {
        console.error('Failed to get base 64 encoded authorization token: Client ID not defined');
        return undefined;
    }

    if (clientSecret === undefined)
    {
        console.error('Failed to get base 64 encoded authorization token: Client secret not defined');
        return undefined;
    }

    var authorizationString = clientId + ":" + clientSecret;
    return Buffer.from(authorizationString, 'utf8').toString('base64');
}
