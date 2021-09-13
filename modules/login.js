// Dependencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));
var randomString = require(path.join(customModulePath, 'randomString.js'));
var redirect = require(path.join(customModulePath, 'redirect.js'));
var cookie = require(path.join(customModulePath, 'cookie.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';

const scopes = 'playlist-read-private playlist-read-collaborative user-top-read user-library-read user-follow-read playlist-modify-public playlist-modify-private';

const stateKey = 'SpotifyAuthorizationState';
const stateLength = 16;

exports.getLoginPage = function(req, res)
{
    // Set state token locally for logging in to be validated against Spotify returned state token
    var stateToken = randomString.generateRandomString(stateLength);
    cookie.setCookie(res, stateKey, stateToken); // Session cookie (no explicit expiration)

    var requestParameters = {
        response_type: 'code',
        client_id: secrets.getClientId(),
        scope: scopes,
        redirect_uri: redirect.getValidateLoginRedirectUri(req),
        state: stateToken
    };

    // Request authorization for this application via a Spotify login page
    res.redirect(spotifyAuthorizeUri + '?' + querystring.stringify(requestParameters));
};

exports.validateLogin = async function(req, res)
{
    // Check for errors after the response page from Spotify
    if (req.query.error !== undefined)
    {
        var error = new Error(req.query.error);
        console.error('Failed to authorize user with Spotify: ' + error.message);
        res.redirect('/accessDenied');
        return;
    }

    // Validate state token from Spotify callback request is the same from the request made locally
    var stateToken = req.query.state || null;
    var storedStateToken = cookie.getCookie(req, stateKey);

    if (stateToken === null || storedStateToken === undefined || storedStateToken === null || stateToken !== storedStateToken)
    {
        var error = new Error('State mismatch between browser state token and Spotify state token');
        console.error('Failed to validate state: ' + error.message);
        res.redirect('/accessDenied');
        return;
    }

    // State validated successfully, can clear the state cookie
    cookie.clearCookie(res, stateKey);

    // Redirect to authorization handling
    try
    {
        var authorizationResponse = await authorize.getAuthorizationTokens(req, res);
    }
    catch (error)
    {
        console.error('Failed to get authorization tokens: ' + error.message);
        res.redirect('/accessDenied');
        return;
    }

    // Use the access token and refresh token to validate access to Spotify's API
    try
    {
        var cookieResponse = await authorize.setAuthorizationCookies(req, res, authorizationResponse);
    }
    catch (error)
    {
        console.error('Failed to set authorization cookies: ' + error.message);
        res.redirect('/accessDenied');
        return;
    }

    // Once we have our tokens, redirect to the home page
    res.redirect('/home');
};

exports.isUserLoggedIn = async function(req, res)
{
    try
    {
        var refreshToken = await authorize.getRefreshTokenFromCookies(req, res);
        var accessToken = await authorize.getAccessToken(req, res);

        // If we have a valid refresh and access token, then a user can be considered logged in
        return Promise.resolve();
    }
    catch
    {
        // User is not logged in
        return Promise.reject();
    }
}

// TODO - Figure out how to make it so that user can login with different Spotify account from login screen
