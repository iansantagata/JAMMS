// Depedencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var randomString = require(path.join(customModulePath, 'randomString.js'));
var secrets = require(path.join(customModulePath, 'secrets.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';
const redirectUri = 'http://localhost/callback';

const scope = 'user-read-private user-read-email';

const stateKey = 'spotify_auth_state';
const stateLength = 16;

exports.getLoginPage = function(req, res)
{
    var state = randomString.generateRandomString(stateLength);
    res.cookie(stateKey, state);

    // Request authorization for this application
    res.redirect(spotifyAuthorizeUri + '?' +
        querystring.stringify({
            response_type: 'code',
            client_id: secrets.getClientId(),
            scope: scope,
            redirect_uri: redirectUri,
            state: state
        })
    );
};
