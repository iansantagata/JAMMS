// Dependencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation
var request = require('request'); // Make Http Requests

// Custom Modules
const customModulePath = __dirname;
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Callback Logic
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';
const spotifyGetCurrentUserUri = 'https://api.spotify.com/v1/me';
const redirect_uri = 'http://localhost/callback';

const stateKey = 'spotify_auth_state';

// TODO - Fix bug to do with infinite looping between the JS in script.js with /callback and this handler
exports.handleCallback = function(error, response, body)
{
    // Handle if there was an error for any reason
    if (error || response.statusCode !== 200)
    {
        res.redirect('/#' +
            querystring.stringify({
                error: 'invalid_token'
            })
        );

        return;
    }

    // Use the access token and refresh token to validate access to Spotify's API
    var accessToken = body.access_token;
    var refreshToken = body.refresh_token;

    var options = {
        url: spotifyGetCurrentUserUri,
        headers: { 'Authorization': 'Bearer ' + accessToken },
        json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body)
    {
        console.log(body);
    });

    // we can also pass the token to the browser to make requests from there
    res.redirect('/#' +
        querystring.stringify({
            access_token: accessToken,
            refresh_token: refreshToken
        })
    );
};

exports.getCallbackPage = function(req, res)
{
    // Validate state is the same from request as stored locally from login
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState)
    {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            })
        );

        return;
    }

    // State validated successfully, request refresh and access tokens
    res.clearCookie(stateKey);
    var authOptions = {
        url: spotifyAccessTokenUri,
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken()
        },
        json: true
    };

    // Make the request to get access and refresh tokens
    request.post(authOptions, this.handleCallback);
};
