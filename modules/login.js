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
var logger = require(path.join(customModulePath, 'logger.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';

const scopes = 'playlist-read-private playlist-read-collaborative user-top-read user-library-read user-follow-read playlist-modify-public playlist-modify-private';

const stateKey = 'SpotifyAuthorizationState';
const stateLength = 16;

exports.getLoginPage = async function(req, res, next)
{
    try
    {
        // Set state token locally for logging in to be validated against Spotify returned state token
        var stateToken = randomString.generateRandomString(stateLength);
        await cookie.setCookie(req, res, stateKey, stateToken); // Session cookie (no explicit expiration)

        var clientId = await secrets.getClientId();
        var redirectUri = redirect.getValidateLoginRedirectUri(req);

        var requestParameters = {
            response_type: 'code',
            client_id: clientId,
            scope: scopes,
            redirect_uri: redirectUri,
            state: stateToken
        };

        // Request authorization for this application via a Spotify login page
        var redirectUri = spotifyAuthorizeUri + '?' + querystring.stringify(requestParameters);
        res.redirect(redirectUri);
    }
    catch (error)
    {
        logger.logError('Failed to get login page: ' + error.message);
        next(error);
        return;
    }
};

exports.validateLogin = async function(req, res)
{
    try
    {
        // Check for errors after the response page from Spotify
        if (req.query.error !== undefined)
        {
            throw new Error(req.query.error);
        }

        // Validate state token from Spotify callback request is the same from the request made locally
        var stateToken = req.query.state || null;
        if (stateToken === undefined || stateToken === null)
        {
            throw new Error('Failed to find state token in request object');
        }

        var storedStateToken = await cookie.getCookie(req, stateKey);
        if (stateToken !== storedStateToken)
        {
            throw new Error('Failed to match state token of browser to Spotify state token');
        }

        // State validated successfully, can clear the state cookie
        await cookie.clearCookie(res, stateKey);

        // Redirect to authorization handling
        var authorizationResponse = await authorize.getAuthorizationTokens(req, res);

        // Use the access token and refresh token to validate access to Spotify's API
        var cookieResponse = await authorize.setAuthorizationCookies(req, res, authorizationResponse);

        // Once we have our tokens, redirect to the home page
        res.redirect('/home');
    }
    catch (error)
    {
        logger.logError('Failed to authorize user with Spotify: ' + error.message);
        res.redirect('/accessDenied');
        return;
    }
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
    catch (error)
    {
        // User is not logged in
        return Promise.reject(error);
    }
}

// TODO - Figure out how to make it so that user can login with different Spotify account from login screen
