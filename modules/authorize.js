"use strict";

// Dependencies
const axios = require("axios"); // Make HTTP requests
const path = require("path"); // URI and local file paths
const querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
const redirect = require(path.join(customModulePath, "redirect.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const units = require(path.join(utilityModulesPath, "unitConversion.js"));
const cookie = require(path.join(utilityModulesPath, "cookie.js"));
const environment = require(path.join(utilityModulesPath, "environment.js"));
const encoding = require(path.join(utilityModulesPath, "encoding.js"));

// Authorize Logic
const spotifyAccessTokenUri = "https://accounts.spotify.com/api/token";

const accessKey = "AccessToken";
const refreshKey = "RefreshToken";

exports.getAuthorizationTokens = async function(req)
{
    try
    {
        // Make sure we have the data we need to get authorization tokens from Spotify
        const authorizationCode = req.query.code;
        if (!authorizationCode)
        {
            throw new Error("Failed to locate authorization code from Spotify");
        }

        const redirectUri = redirect.getValidateLoginRedirectUri(req);

        // Make the request to get access and refresh tokens
        const requestData = {
            code: authorizationCode,
            grant_type: "authorization_code",
            redirect_uri: redirectUri
        };

        const authorizationToken = await getBase64EncodedAuthorizationToken();

        const requestOptions = {
            headers: {
                "Authorization": `Basic ${authorizationToken}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        // Trigger the authorization request
        const response = await axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions);

        // Extract only the data from the successful response that is needed
        const authorizationResponse = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            scopes: response.data.scope,
            tokenExpirationInMsec: units.getMillisecondsFromSeconds(response.data.expires_in),
            tokenType: response.data.token_type
        };

        // Return authorization data to the caller
        return Promise.resolve(authorizationResponse);
    }
    catch (error)
    {
        // Handle if there was an error for any reason
        logger.logError(`Failed to get authorization tokens: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAuthorizationTokensViaRefresh = async function(req, res)
{
    try
    {
        // Get the refresh token from cookies
        const refreshToken = await cookie.getCookie(req, refreshKey);

        // Request the access token from the refresh token
        const requestData = {
            grant_type: "refresh_token",
            refresh_token: refreshToken
        };

        const authToken = await getBase64EncodedAuthorizationToken();
        const requestOptions = {
            headers: {
                Authorization: `Basic ${authToken}`
            }
        };

        // Make the request to Spotify to get a new access token
        const response = await axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions);

        // Got a new access token successfully
        const refreshAuthorizationResponse = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            scopes: response.data.scope,
            tokenExpirationInMsec: units.getMillisecondsFromSeconds(response.data.expires_in),
            tokenType: response.data.token_type
        };

        // Throw the new token back into a cookie for the user to use
        const accessTypeAndToken = `${refreshAuthorizationResponse.tokenType} ${refreshAuthorizationResponse.accessToken}`;
        const cookieSettings = {
            maxAge: refreshAuthorizationResponse.tokenExpirationInMsec
        };
        cookie.setCookie(req, res, accessKey, accessTypeAndToken, cookieSettings);

        // If the request did return a new refresh token, make sure we overwrite the old token
        if (refreshAuthorizationResponse.refreshToken)
        {
            cookie.setCookie(req, res, refreshKey, refreshAuthorizationResponse.refreshToken); // Session cookie (no explicit expiration)
        }

        // Return success when re-authorization occurred
        return Promise.resolve(refreshAuthorizationResponse);
    }
    catch (error)
    {
        // Failed to re-authorize, return failure
        logger.logError(`Failed to refresh authorization tokens: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAccessToken = async function(req, res)
{
    try
    {
        // Try to get a valid access token from cookies if it exists and has not expired
        const accessTokenFromCookies = await exports.getAccessTokenFromCookies(req);
        return Promise.resolve(accessTokenFromCookies);
    }
    catch (cookieError)
    {
        // If a valid access token cookie does not exist, then try to refresh to get a valid one
        try
        {
            const response = await exports.getAuthorizationTokensViaRefresh(req, res);

            // Use the response rather than going to newly refreshed cookies to retrieve the token again
            const accessTokenFromRefresh = `${response.tokenType} ${response.accessToken}`;
            return Promise.resolve(accessTokenFromRefresh);
        }
        catch (refreshError)
        {
            // Did not successfully set cookie
            logger.logError(`Failed to get access token: ${cookieError.message}`);
            logger.logError(`Failed to get access token: ${refreshError.message}`);
            return Promise.reject(refreshError);
        }
    }
};

exports.getAccessTokenFromCookies = async function(req)
{
    try
    {
        const accessToken = await cookie.getCookie(req, accessKey);
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
        const refreshToken = await cookie.getCookie(req, refreshKey);
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
        if (!auth)
        {
            throw new Error("Authorization data not provided");
        }

        if (!auth.tokenExpirationInMsec)
        {
            throw new Error("Expiration time not found");
        }

        if (!auth.tokenType)
        {
            throw new Error("Token type not found");
        }

        if (!auth.accessToken)
        {
            throw new Error("Access token not found");
        }

        if (!auth.refreshToken)
        {
            throw new Error("Refresh token not found");
        }

        const accessTypeAndToken = `${auth.tokenType} ${auth.accessToken}`;
        const cookieSettings = {
            maxAge: auth.tokenExpirationInMsec
        };
        cookie.setCookie(req, res, accessKey, accessTypeAndToken, cookieSettings);
        cookie.setCookie(req, res, refreshKey, auth.refreshToken); // Session cookie (no explicit expiration);

        // No return value, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to set authorization cookies: ${error.message}`);
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
        logger.logError(`Failed to delete authorization cookies: ${error.message}`);
        return Promise.reject(error);
    }
};

// Local Helper Functions
async function getBase64EncodedAuthorizationToken()
{
    try
    {
        const clientId = await environment.getClientId();
        const clientSecret = await environment.getClientSecret();

        const authorizationString = `${clientId}:${clientSecret}`;
        const encodedBase64String = await encoding.encodeInBase64(authorizationString);

        return Promise.resolve(encodedBase64String);
    }
    catch (error)
    {
        logger.logError(`Failed to get base 64 encoded authorization token: ${error.message}`);
        return Promise.reject(error);
    }
};
