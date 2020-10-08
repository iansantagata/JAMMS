// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

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
    // Make the request to get access and refresh tokens
    var requestData = {
        code: req.query.code || null,
        redirect_uri: redirect.getValidateLoginRedirectUri(req),
        grant_type: 'authorization_code'
    };

    var requestOptions = {
        headers: {
            'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken(),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    // Trigger the request and handle possible responses
    axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions)
        .then(response =>
            {
                // TODO - Move this functionality to a more appropriate place / function name
                exports.handleCallback(res, response);
            })
        .catch(error =>
            {
                // Handle if there was an error for any reason
                console.log(error.message);
                res.redirect('access_denied');
            });
}

exports.handleCallback = function(res, spotifyResponse)
{
    // Use the access token and refresh token to validate access to Spotify's API
    // TODO - Set the access token as a cookie and figure out how to store access token to refresh token mapping server-side
    var accessToken = spotifyResponse.data.access_token;
    var refreshToken = spotifyResponse.data.refresh_token;

    // TODO - This is where we should actually be making calls and doing important stuff!
    // TODO - Replace all of the below with what we actually want the app to do
    var requestOptions = {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }

    // Use the access token to access the Spotify Web API
    // TODO - Change this to grab the data needed for the home page (or move this call into that middleware) if any is needed at all
    axios.get(spotifyGetCurrentUserUri, requestOptions)
        .then(response =>
            {
                console.log(response.data)
            })
        .catch(error =>
            {
                console.log(error.message);
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
