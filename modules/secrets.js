// Depedencies
var fs = require('fs'); // File System
var path = require('path'); // URL and local file paths
var process = require('process'); // Process for environment variables

// Secrets Logic
const secretsPath = path.join(__dirname, '..', 'secrets');
const clientIdPath = 'client_id.secret';
const clientSecretPath = 'client_secret.secret';

exports.getClientId = function()
{
    try
    {
        // Try to read from environment variables first and fall back to fixed file secret if no environment variable exists
        var clientIdEnvironmentVariable = process.env.client_id;
        if (clientIdEnvironmentVariable !== undefined && clientIdEnvironmentVariable !== null)
        {
            return clientIdEnvironmentVariable.trim();
        }

        return fs.readFileSync(path.join(secretsPath, clientIdPath), 'utf8').trim();
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

        return fs.readFileSync(path.join(secretsPath, clientSecretPath), 'utf8').trim();
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
