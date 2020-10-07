// Dependencies
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
    var stateToken = req.query.state || null;
    var storedStateToken = req.cookies ? req.cookies[stateKey] : null;

    if (stateToken === null || storedStateToken === null || stateToken !== storedStateToken)
    {
        var error = new Error('State mismatch between browser state token and Spotify state token');
        next(error);
        return;
    }

    // State validated successfully, can clear the state cookie
    res.clearCookie(stateKey);

    // Redirect to authorization handling
    req.redirectUri = getRedirectUri(req);
    res.redirect('/authorize');
};
