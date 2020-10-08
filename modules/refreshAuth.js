// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Refresh Token Logic
const spotifyAccessTokenUri = 'https://accounts.spotify.com/api/token';

// TODO - Make access and/or refresh tokens cookies rather than utilizing them directly in the browser
exports.getAccessToken = function(req, res)
{
    // Request the access token from the refresh token
    var requestData = {
        grant_type: 'refresh_token',
        refresh_token: req.query.refresh_token
    };

    var requestOptions = {
        headers: {
            'Authorization': 'Basic ' + secrets.getBase64EncodedAuthorizationToken()
        }
    };

    axios.post(spotifyAccessTokenUri, querystring.stringify(requestData), requestOptions)
        .then(response =>
            {
                // Send the access token to the browser via the response
                res.send({
                    'access_token': response.data.access_token
                });
            })
        .catch(error =>
            {
                console.error(error.message);
            });
};
