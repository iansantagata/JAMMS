/*
 * Main Node Application and Event Handler for JAMM App
 */

 console.log('Starting application');

// Dependencies
var express = require('express'); // Express web server framework
var path = require('path'); // URI and local file paths
var cors = require('cors'); // Cross-origin resource sharing
var cookieParser = require('cookie-parser'); // Parsing and storing encrypted cookies

// Custom Modules
const customModulePath = path.join(__dirname, 'modules');
var authorize = require(path.join(customModulePath, 'authorize.js'));
var error = require(path.join(customModulePath, 'error.js'));
var home = require(path.join(customModulePath, 'home.js'));
var login = require(path.join(customModulePath, 'login.js'));
var refreshAuth = require(path.join(customModulePath, 'refreshAuth.js'));

// Setup Page Handling
const staticFilesPath = path.join(__dirname, 'public');

var app = express();
app.use(express.static(staticFilesPath))
   .use(cors())
   .use(cookieParser());

// Home Logic
app.get('/home', home.getHomePage);

// Login Logic
app.get('/login', login.getLoginPage);
app.get('/validateLogin', login.validateLogin);

// Authorization Logic
app.get('/refresh_token', refreshAuth.getAccessToken);

// Error Handling
app.use('/access_denied', error.handleAccessNotAllowed);
app.use(error.handlePageNotFound);
app.use(error.handleUnexpectedError);

// Listening Port
console.log('Listening for requests on port 80');
app.listen(80);
