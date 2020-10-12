// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var home = require(path.join(customModulePath, 'home.js'));
var redirect = require(path.join(customModulePath, 'redirect.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Authorize Logic
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';

const accessKey = 'accessToken';
const refreshKey = 'refreshToken';

exports.getAuthorizationTokens = function(req, res)
{
    // Make the request to get access and refresh tokens
    var requestData = {
        code: req.query.code || null,
        redirect_uri: redirect.getValidateLoginRedirectUri(req),
        grant_type: 'authorization_code'
    };

    var requestOptions = {
        headers: {
            'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken(),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    // Trigger the request and handle possible responses
    axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions)
        .then(response =>
            {
                // Use the access token and refresh token to validate access to Spotify's API
                // TODO - Remove most of these, saves as variables to show what the output could be, but don't need most of it
                var accessToken = response.data.access_token;
                var refreshToken = response.data.refresh_token;
                var scopes = response.data.scope;
                var tokenExpirationInMsec = response.data.expires_in * 1000;
                var tokenType = response.data.token_type;

                var cookieOptions = {
                    maxAge: tokenExpirationInMsec
                };

                // TODO - Figure out a better way to store this information than browser cookies (which is insecure, at least for refresh token)
                // TODO - Look into signed cookies (see cookie-parser docs) to still use client cookies, but ensure tampering is accounted for (interception still an issue however)
                res.cookie(accessKey, tokenType + ' ' + accessToken, cookieOptions);
                res.cookie(refreshKey, refreshToken); // Session cookie since it has no timeout

                // Once we have our tokens, redirect to the home page
                // TODO - Depending on how and when we have to re-authenticate and refresh the keys, may need to make this redirect dynamic (a param))
                res.redirect('/home');
            })
        .catch(error =>
            {
                // Handle if there was an error for any reason
                console.log(error.message);
                res.redirect('/access_denied');
            });
};

exports.getAuthorizationTokensViaRefresh = async function(req, res)
{
    // Get the refresh token from cookies
    // TODO - Access token is the only one that should be a cookie, figure out how to handle this more securely
    var refreshToken = req.cookies ? req.cookies[refreshKey] : null;

    if (refreshToken === null) {
        var error = new Error('Refresh token not found, unable to get new access token to authorize Spotify usage.');
        console.error(error);
        return Promise.reject();
    }

    // Request the access token from the refresh token
    var requestData = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    };

    var requestOptions = {
        headers: {
            'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken()
        }
    };

    // Make the request to Spotify to get a new access token
    try
    {
        var response = await axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        // Failed to re-authorize, return failure
        console.error(error.message);
        return Promise.reject();
    }

    // Got a new access token successfully
    // TODO - Remove most of these, saves as variables to show what the output could be, but don't need most of it
    var accessToken = response.data.access_token;
    var updatedRefreshToken = response.data.refresh_token;
    var tokenType = response.data.token_type;
    var scopes = response.data.scope;
    var tokenExpirationInMsec = response.data.expires_in * 1000;

    var cookieOptions = {
        maxAge: tokenExpirationInMsec
    };

    // Throw the new token back into a cookie for the user to use
    res.cookie(accessKey, tokenType + ' ' + accessToken, cookieOptions);

    // If the request did return a new refresh token, make sure we overwrite the old token
    if (updatedRefreshToken !== undefined && updatedRefreshToken !== null)
    {
        res.cookie(refreshKey, updatedRefreshToken);
    }

    // Return success when re-authorization occurred
    return Promise.resolve();
};

exports.getAccessTokenFromCookies = async function(req, res)
{
    var accessToken = req.cookies ? req.cookies[accessKey] : null;

    // Make sure we actually have the cookie, but if it expired, try to refresh it
    if (accessToken === undefined || accessToken === null)
    {
        try
        {
            await exports.getAuthorizationTokensViaRefresh(req, res);
        }
        catch (error)
        {
            // Did not successfully set cookie
            res.redirect('/access_denied');
            return;
        }

        // Since we refreshed the cookie, re-retrieve it
        accessToken = req.cookies[accessKey]; // TODO - Not sure if this is right since we haven't changed requests yet?  Unsure, needs testing
    }

    return accessToken;
}
