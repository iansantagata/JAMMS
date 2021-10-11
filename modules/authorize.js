// Dependencies
var axios = require("axios"); // Make HTTP requests
var path = require("path"); // URI and local file paths
var querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var redirect = require(path.join(customModulePath, "redirect.js"));
var secrets = require(path.join(customModulePath, "secrets.js"));
var cookie = require(path.join(customModulePath, "cookie.js"));
var logger = require(path.join(customModulePath, "logger.js"));

// Authorize Logic
const spotifyAccessTokenUri = "https://accounts.spotify.com/api/token";

const accessKey = "AccessToken";
const refreshKey = "RefreshToken";

exports.getAuthorizationTokens = async function(req)
{
    try
    {
        // Make sure we have the data we need to get authorization tokens from Spotify
        var authorizationCode = req.query.code || null;
        if (authorizationCode === undefined || authorizationCode === null)
        {
            throw new Error("Failed to locate authorization code from Spotify");
        }

        var redirectUri = redirect.getValidateLoginRedirectUri(req);

        // Make the request to get access and refresh tokens
        var requestData = {
            code: authorizationCode,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        };

        var authorizationToken = await secrets.getBase64EncodedAuthorizationToken();

        var requestOptions = {
            headers: {
                "Authorization": "Basic " + authorizationToken,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        // Trigger the authorization request
        var response = await axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions);

        // Extract only the data from the successful response that is needed
        var authorizationResponse = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            scopes: response.data.scope,
            tokenExpirationInMsec: response.data.expires_in * 1000,
            tokenType: response.data.token_type
        };

        // Return authorization data to the caller
        return Promise.resolve(authorizationResponse);
    }
    catch (error)
    {
        // Handle if there was an error for any reason
        logger.logError("Failed to get authorization tokens: " + error.message);
        return Promise.reject(error);
    }
};

exports.getAuthorizationTokensViaRefresh = async function(req, res)
{
    try
    {
        // Get the refresh token from cookies
        var refreshToken = await cookie.getCookie(req, refreshKey);

        // Request the access token from the refresh token
        var requestData = {
            grant_type: "refresh_token",
            refresh_token: refreshToken
        };

        var authToken = await secrets.getBase64EncodedAuthorizationToken();
        var requestOptions = {
            headers: {
                "Authorization": "Basic " + authToken
            }
        };

        // Make the request to Spotify to get a new access token
        var response = await axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions);

        // Got a new access token successfully
        var refreshAuthorizationResponse = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            scopes: response.data.scope,
            tokenExpirationInMsec: response.data.expires_in * 1000,
            tokenType: response.data.token_type
        };

        // Throw the new token back into a cookie for the user to use
        var accessTypeAndToken = refreshAuthorizationResponse.tokenType + " " + refreshAuthorizationResponse.accessToken;
        var cookieSettings = {
            maxAge: refreshAuthorizationResponse.tokenExpirationInMsec
        };
        cookie.setCookie(req, res, accessKey, accessTypeAndToken, cookieSettings);

        // If the request did return a new refresh token, make sure we overwrite the old token
        if (refreshAuthorizationResponse.refreshToken !== undefined && refreshAuthorizationResponse.refreshToken !== null)
        {
            cookie.setCookie(req, res, refreshKey, refreshAuthorizationResponse.refreshToken); // Session cookie (no explicit expiration)
        }

        // Return success when re-authorization occurred
        return Promise.resolve(refreshAuthorizationResponse);
    }
    catch (error)
    {
        // Failed to re-authorize, return failure
        logger.logError("Failed to refresh authorization tokens: " + error.message);
        return Promise.reject(error);
    }
};

exports.getAccessToken = async function(req, res)
{
    try
    {
        // Try to get a valid access token from cookies if it exists and has not expired
        var accessToken = await exports.getAccessTokenFromCookies(req);
        return Promise.resolve(accessToken);
    }
    catch (cookieError)
    {
        // If a valid access token cookie does not exist, then try to refresh to get a valid one
        try
        {
            var response = await exports.getAuthorizationTokensViaRefresh(req, res);

            // Use the response rather than going to newly refreshed cookies to retrieve the token again
            accessToken = response.tokenType + " " + response.accessToken;
            return Promise.resolve(accessToken);
        }
        catch (refreshError)
        {
            // Did not successfully set cookie
            logger.logError("Failed to get access token: " + cookieError.message);
            logger.logError("Failed to get access token: " + refreshError.message);
            return Promise.reject(refreshError);
        }
    }
};

exports.getAccessTokenFromCookies = async function(req)
{
    try
    {
        var accessToken = await cookie.getCookie(req, accessKey);
        return Promise.resolve(accessToken);
    }
    catch (error)
    {
        // Do not log an error here because it is potentially legitimate that a cookie expired or does not yet exist
        return Promise.reject(error);
    }
};

exports.getRefreshTokenFromCookies = async function(req)
{
    try
    {
        var refreshToken = await cookie.getCookie(req, refreshKey);
        return Promise.resolve(refreshToken);
    }
    catch (error)
    {
        // Do not log an error here because it is potentially legitimate that a cookie expired or does not yet exist
        return Promise.reject(error);
    }
};

exports.setAuthorizationCookies = function(req, res, auth)
{
    try
    {
        // Make sure that we have all the needed authorization data to set the cookies
        if (auth === undefined || auth === null)
        {
            throw new Error("Authorization data not provided");
        }

        if (auth.tokenExpirationInMsec === undefined || auth.tokenExpirationInMsec === null)
        {
            throw new Error("Expiration time not found");
        }

        if (auth.tokenType === undefined || auth.tokenType === null)
        {
            throw new Error("Token type not found");
        }

        if (auth.accessToken === undefined || auth.accessToken === null)
        {
            throw new Error("Access token not found");
        }

        if (auth.refreshToken === undefined || auth.refreshToken === null)
        {
            throw new Error("Refresh token not found");
        }

        var accessTypeAndToken = auth.tokenType + " " + auth.accessToken;
        var cookieSettings = {
            maxAge: auth.tokenExpirationInMsec
        };
        cookie.setCookie(req, res, accessKey, accessTypeAndToken, cookieSettings);
        cookie.setCookie(req, res, refreshKey, auth.refreshToken); // Session cookie (no explicit expiration);

        // No return value, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError("Failed to set authorization cookies: " + error.message);
        return Promise.reject(error);
    }
};

exports.deleteAuthorizationCookies = async function(res)
{
    try
    {
        await cookie.clearCookie(res, accessKey);
        await cookie.clearCookie(res, refreshKey);

        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError("Failed to delete authorization cookies: " + error.message);
        return Promise.reject(error);
    }
};
