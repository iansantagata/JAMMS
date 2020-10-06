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

// TODO - Redirect uri here isn't actually used, it just needs to match the same value that was used before
// TODO - Figure out a better way to make sure they match
const redirect_uri = 'http://localhost/callback';

const stateKey = 'spotify_auth_state';

exports.getCallbackPage = function(req, res, next)
{
    // Validate state token from Spotify callback request is the same from the request made locally
    var code = req.query.code || null;
    var stateToken = req.query.state || null;
    var storedStateToken = req.cookies ? req.cookies[stateKey] : null;

    if (stateToken === null || storedStateToken === null || stateToken !== storedStateToken)
    {
        next(new Error('State mismatch between browser state token and Spotify state token'));
        return;
    }

    // State validated successfully, can clear the cookie and request refresh and access tokens
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

// TODO - Fix bug to do with infinite looping between the JS in script.js with /callback and this handler
exports.handleCallback = function(error, response, body)
{
    // Handle if there was an error for any reason
    // TODO - Investigate if error is even valid here as part of the response or not
    // TODO - Convert this to be a redirect change to access denied page instead
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
