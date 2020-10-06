// Depedencies
var fs = require('fs'); // File System
var path = require('path'); // URL and local file paths

// Secrets Logic
const secretsPath = path.join(__dirname, '..', 'secrets');

exports.getClientId = function()
{
    try
    {
        return fs.readFileSync(path.join(secretsPath, 'client_id.secret'), 'utf8').trim();
    }
    catch (err)
    {
        console.error(err);
    }
}

exports.getClientSecret = function()
{
    try
    {
        return fs.readFileSync(path.join(secretsPath, 'client_secret.secret'), 'utf8').trim();
    }
    catch (err)
    {
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
