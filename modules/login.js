"use strict";

// Dependencies
const path = require("path"); // URI and local file paths
const querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
const authorize = require(path.join(customModulePath, "authorize.js"));
const redirect = require(path.join(customModulePath, "redirect.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const environment = require(path.join(utilityModulesPath, "environment.js"));
const cookie = require(path.join(utilityModulesPath, "cookie.js"));

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
        const stateToken = generateRandomString(stateLength);
        cookie.setCookie(req, res, stateKey, stateToken); // Session cookie (no explicit expiration)

        const clientId = await environment.getClientId();
        const redirectUri = redirect.getValidateLoginRedirectUri(req);

        const requestParameters = {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: scopes,
            show_dialog: true,
            state: stateToken
        };

        // Request authorization for this application via a Spotify login page
        const spotifyAuthorizeFullUri = `${spotifyAuthorizeUri}?${querystring.stringify(requestParameters)}`;
        res.redirect(spotifyAuthorizeFullUri);
    }
    catch (error)
    {
        logger.logError(`Failed to get login page: ${error.message}`);
        next(error);
    }
};

exports.validateLogin = async function(req, res)
{
    try
    {
        // Check for errors after the response page from Spotify
        const validationError = req.query.error;
        if (validationError)
        {
            throw new Error(validationError);
        }

        // Validate state token from Spotify callback request is the same from the request made locally
        const stateToken = req.query.state;
        if (!stateToken)
        {
            throw new Error("Failed to find state token in request object");
        }

        const storedStateToken = await cookie.getCookie(req, stateKey);
        if (stateToken !== storedStateToken)
        {
            throw new Error("Failed to match state token of browser to Spotify state token");
        }

        // State validated successfully, can clear the state cookie
        await cookie.clearCookie(res, stateKey);

        // Redirect to authorization handling
        const authorizationResponse = await authorize.getAuthorizationTokens(req);

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

        logger.logError(`Failed to authorize user with Spotify: ${error.message}`);
        res.redirect("/accessDenied");
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
function generateRandomString(targetLength)
{
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < targetLength; i++)
    {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
