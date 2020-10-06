/*
 * Main Node Application and Event Handler for JAMM App
 */

// Depedencies
var express = require('express'); // Express web server framework
var path = require('path'); // URI and local file paths
var cors = require('cors');
var cookieParser = require('cookie-parser');

// Custom Modules
const customModulePath = path.join(__dirname, 'modules');
var login = require(path.join(customModulePath, 'login.js'));
var callback = require(path.join(customModulePath, 'callback.js'));
var refreshAuth = require(path.join(customModulePath, 'refreshAuth.js'));

// Setup Page Handling
const staticFilesPath = path.join(__dirname, 'public');

var app = express();

app.use(express.static(staticFilesPath))
   .use(cors())
   .use(cookieParser());

// Login Page
app.get('/login', login.getLoginPage);

// Callback Page
app.get('/callback', callback.getCallbackPage);

// Refresh Token Page
app.get('/refresh_token', refreshAuth.getAccessToken);

// Listening Port
console.log('Listening on port 80');
app.listen(80);
