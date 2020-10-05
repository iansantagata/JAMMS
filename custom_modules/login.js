// Depedencies
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var secrets = require(path.join(customModulePath, 'secrets.js'));
var randomString = require(path.join(customModulePath, 'randomString.js'));

// Login Logic
const spotifyAuthorizeUri = 'https://accounts.spotify.com/authorize';
const redirectUri = 'http://localhost/callback';

const stateKey = 'spotify_auth_state';
const scope = 'user-read-private user-read-email';

exports.getLoginPage = function(req, res)
{
  var state = randomString.generateRandomString(16);
  res.cookie(stateKey, state);

  // Request authorization for this application
  res.redirect(spotifyAuthorizeUri + '?' +
    querystring.stringify({
      response_type: 'code',
      client_id: secrets.getClientId(),
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
};
