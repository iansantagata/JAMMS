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
                var accessToken = response.data.access_token;
                var refreshToken = response.data.refresh_token;

                // TODO - Figure out a better way to store this information than browser cookies (which is insecure, at least for refresh token)
                res.cookie(accessToken);
                res.cookie(refreshToken);

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
