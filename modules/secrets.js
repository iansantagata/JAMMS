// Secrets Logic
exports.getClientId = function()
{
    try
    {
        // Try to read from environment variables
        var clientIdEnvironmentVariable = process.env.client_id;
        if (clientIdEnvironmentVariable !== undefined && clientIdEnvironmentVariable !== null)
        {
            return clientIdEnvironmentVariable.trim();
        }

        return undefined;
    }
    catch (err)
    {
        // TODO - Make this error more apparent and friendly to the user (like when the secret doesn't exist)
        console.error(err);
    }
}

exports.getClientSecret = function()
{
    try
    {
        // Try to read from environment variables first and fall back to fixed file secret if no environment variable exists
        var clientSecretEnvironmentVariable = process.env.client_secret;
        if (clientSecretEnvironmentVariable !== undefined && clientSecretEnvironmentVariable !== null)
        {
            return clientSecretEnvironmentVariable.trim();
        }

        return undefined;
    }
    catch (err)
    {
        // TODO - Make this error more apparent and friendly to the user (like when the secret doesn't exist)
        console.error(err);
    }
}

exports.getBase64EncodedAuthorizationToken = function()
{
    var clientId = this.getClientId();
    var clientSecret = this.getClientSecret();
    var authorizationString = clientId + ":" + clientSecret;
    return Buffer.from(authorizationString, 'utf8').toString('base64');
}
