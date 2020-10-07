// Dependencies
var path = require('path'); // URI and local file paths
var request = require('request'); // Make Http Requests

// Custom Modules
const customModulePath = __dirname;
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Refresh Token Logic
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';

exports.handleAccessCallback = function(error, response, body)
{
    if (error || response.statusCode !== 200) {
        console.error(error);
        return;
    }

    var accessToken = body.access_token;
    res.send({
        'access_token': accessToken
    });
};

// TODO - Make access and/or refresh tokens cookies rather than utilizing them directly in the browser
exports.getAccessToken = function(req, res)
{
    // Request the access token from the refresh token
    var refreshToken = req.query.refresh_token;
    var authOptions = {
        url: spotifyAccessTokenUri,
        headers: { 'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken() },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        },
        json: true
    };

    // Send the access token to the browser via the response
    request.post(authOptions, this.handleAccessCallback);
};
