// Depedencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation
var request = require('request'); // Make Http Requests

// Custom Modules
const customModulePath = __dirname;
var randomString = require(path.join(customModulePath, 'randomString.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';
const spotifyGetCurrentUserUri = 'https://api.spotify.com/v1/me';

// TODO - Change / remove scopes when we no longer need to access the GetCurrentUser endpoint
const scope = 'user-read-private user-read-email';

const stateKey = 'SpotifyAuthorizationState';
const stateLength = 16;

const callbackEndpoint = '/validateLogin';

// Build the full Uri to work both in production and while developing
var getRedirectUri = function(req)
{
    var hostName = req.hostName;
    if (req.hostName === undefined)
    {
        hostName = 'localhost';
    }
    return req.protocol + '://' + hostName + callbackEndpoint;
};

exports.getLoginPage = function(req, res)
{
    // Set state token locally for logging in to be validated against Spotify returned state token
    var stateToken = randomString.generateRandomString(stateLength);
    res.cookie(stateKey, stateToken);

    var redirectUri = getRedirectUri(req);

    // Request authorization for this application via a Spotify login page
    res.redirect(spotifyAuthorizeUri + '?' +
        querystring.stringify({
            response_type: 'code',
            client_id: secrets.getClientId(),
            scope: scope,
            redirect_uri: redirectUri,
            state: stateToken
        })
    );
};

exports.validateLogin = function(req, res, next)
{
    // Validate state token from Spotify callback request is the same from the request made locally
    var code = req.query.code || null;
    var stateToken = req.query.state || null;
    var storedStateToken = req.cookies ? req.cookies[stateKey] : null;

    if (stateToken === null || storedStateToken === null || stateToken !== storedStateToken)
    {
        var error = new Error('State mismatch between browser state token and Spotify state token');
        next(error);
        return;
    }

    var redirectUri = getRedirectUri(req);

    // State validated successfully, can clear the state cookie and request refresh and access tokens
    res.clearCookie(stateKey);
    var authOptions = {
        url: spotifyAccessTokenUri,
        form: {
            code: code,
            redirect_uri: redirectUri,
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
