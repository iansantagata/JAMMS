// Dependencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation
var request = require('request'); // Make Http Requests

// Custom Modules
const customModulePath = __dirname;
// TODO - // var home = require(path.join(customModulePath, 'home.js'));
var login = require(path.join(customModulePath, 'login.js'));
var redirect = require(path.join(customModulePath, 'redirect.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Authorize Logic
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';
const spotifyGetCurrentUserUri = 'https://api.spotify.com/v1/me/';

exports.getAuthorizationTokens = function(req, res)
{
    // TODO - // this.getAuthorizationTokens(req, res, home.getHomePage);
}

exports.getAuthorizationTokens = function(req, res, callback)
{
    var code = req.query.code || null;
    var redirectUri = redirect.getValidateLoginRedirectUri(req);
    var authorizationHeaderValue = 'Basic ' + secrets.getBase64EncodedAuthorizationToken();

    // State validated successfully, can clear the state cookie and request refresh and access tokens
    var authorizeOptions = {
        url: spotifyAccessTokenUri,
        form: {
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': authorizationHeaderValue
        },
        json: true
    };

    // Make the request to get access and refresh tokens
    // TODO - Replace request with a different library, because this is sure to be a pain
    request.post(authorizeOptions,
        function(error, spotifyResponse, body)
        {
            exports.handleCallback(error, res, spotifyResponse, body);
        }
    );
}

exports.handleCallback = function(err, res, spotifyResponse, body)
{
    // Handle if there was an error for any reason
    if (err || spotifyResponse.statusCode !== 200)
    {
        res.redirect('access_denied');
        return;
    }

    // Use the access token and refresh token to validate access to Spotify's API
    // TODO - Set the access token as a cookie and figure out how to store access token to refresh token mapping server-side
    var accessToken = body.access_token;
    var refreshToken = body.refresh_token;

    // TODO - This is where we should actually be making calls and doing important stuff!
    // TODO - Replace all of the below with what we actually want the app to do
    var options = {
        url: spotifyGetCurrentUserUri,
        headers: { 'Authorization': 'Bearer ' + accessToken },
        json: true
    };

    // Use the access token to access the Spotify Web API

    // TODO - Change this to grab the data needed for the home page (or move this call into that middleware) if any is needed at all
    request.get(options, function(err, spotifyResponse, body)
    {
        console.log(body);
    });

    // we can also pass the token to the browser to make requests from there
    // TODO - Remove this and change it to redirect somewhere else, maybe the home page
    res.redirect('/#' +
        querystring.stringify({
            access_token: accessToken,
            refresh_token: refreshToken
        })
    );
};
