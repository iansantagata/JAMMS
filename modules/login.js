// Dependencies
var path = require("path"); // URI and local file paths
var querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, "authorize.js"));
var environment = require(path.join(customModulePath, "environment.js"));
var redirect = require(path.join(customModulePath, "redirect.js"));
var cookie = require(path.join(customModulePath, "cookie.js"));
var logger = require(path.join(customModulePath, "logger.js"));

// Login Logic
const spotifyAuthorizeUri = "https://accounts.spotify.com/authorize";

const scopes = "playlist-read-private playlist-read-collaborative user-top-read user-library-read user-follow-read playlist-modify-public playlist-modify-private";

const stateKey = "SpotifyAuthorizationState";
const stateLength = 16;

exports.getLoginPage = async function(req, res, next)
{
    try
    {
        // Set state token locally for logging in to be validated against Spotify returned state token
        var stateToken = generateRandomString(stateLength);
        cookie.setCookie(req, res, stateKey, stateToken); // Session cookie (no explicit expiration)

        var clientId = await environment.getClientId();
        var redirectUri = redirect.getValidateLoginRedirectUri(req);

        var requestParameters = {
            response_type: "code",
            client_id: clientId,
            scope: scopes,
            redirect_uri: redirectUri,
            state: stateToken
        };

        // Request authorization for this application via a Spotify login page
        var spotifyAuthorizeFullUri = spotifyAuthorizeUri + "?" + querystring.stringify(requestParameters);
        res.redirect(spotifyAuthorizeFullUri);
    }
    catch (error)
    {
        logger.logError("Failed to get login page: " + error.message);
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
            throw new Error("Failed to find state token in request object");
        }

        var storedStateToken = await cookie.getCookie(req, stateKey);
        if (stateToken !== storedStateToken)
        {
            throw new Error("Failed to match state token of browser to Spotify state token");
        }

        // State validated successfully, can clear the state cookie
        await cookie.clearCookie(res, stateKey);

        // Redirect to authorization handling
        var authorizationResponse = await authorize.getAuthorizationTokens(req);

        // Use the access token and refresh token to validate access to Spotify's API
        await authorize.setAuthorizationCookies(req, res, authorizationResponse);

        // Once we have our tokens, redirect to the home page
        res.redirect("/home");
    }
    catch (error)
    {
        // Clean up any potentially set login cookies if login has failed
        // This is to be sure that a user is not stuck in a half logged in state
        await cookie.clearCookie(res, stateKey);
        await authorize.deleteAuthorizationCookies(res);

        logger.logError("Failed to authorize user with Spotify: " + error.message);
        res.redirect("/accessDenied");
        return;
    }
};

exports.isUserLoggedIn = async function(req, res)
{
    try
    {
        await authorize.getRefreshTokenFromCookies(req);
        await authorize.getAccessToken(req, res);

        // If we have a valid refresh and access token (retrieving them did not throw an error), then a user can be considered logged in
        return Promise.resolve(true);
    }
    catch (error)
    {
        // User is not logged in if we failed to get their login tokens (can swallow errors here)
        return Promise.resolve(false);
    }
};

// Helper Functions
var generateRandomString = function(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// TODO - Figure out how to make it so that user can login with different Spotify account from login screen
