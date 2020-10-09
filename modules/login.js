// Dependencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));
var randomString = require(path.join(customModulePath, 'randomString.js'));
var redirect = require(path.join(customModulePath, 'redirect.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';

const stateKey = 'SpotifyAuthorizationState';
const stateLength = 16;

exports.getLoginPage = function(req, res)
{
    // Set state token locally for logging in to be validated against Spotify returned state token
    var stateToken = randomString.generateRandomString(stateLength);
    res.cookie(stateKey, stateToken);

    var redirectUri = redirect.getValidateLoginRedirectUri(req);

    // Request authorization for this application via a Spotify login page
    res.redirect(spotifyAuthorizeUri + '?' +
        querystring.stringify({
            response_type: 'code',
            client_id: secrets.getClientId(),
            redirect_uri: redirectUri,
            state: stateToken
        })
    );
};

exports.validateLogin = function(req, res)
{
    // Check for errors after the response page from Spotify
    if (req.query.error !== undefined)
    {
        var error = new Error('Failed to authorize user with Spotify - ' + req.query.error);
        console.error(error);
        res.redirect('/access_denied');
        return;
    }

    // Validate state token from Spotify callback request is the same from the request made locally
    var stateToken = req.query.state || null;
    var storedStateToken = req.cookies ? req.cookies[stateKey] : null;

    if (stateToken === null || storedStateToken === null || stateToken !== storedStateToken)
    {
        var error = new Error('State mismatch between browser state token and Spotify state token');
        console.error(error);
        rs.redirect('/access_denied');
        return;
    }

    // State validated successfully, can clear the state cookie
    res.clearCookie(stateKey);

    // Redirect to authorization handling
    authorize.getAuthorizationTokens(req, res);
};
