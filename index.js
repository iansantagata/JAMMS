/*
 * Main Node Application and Event Handler for JAMM App
 */

 console.log('Starting application');

// Dependencies
var express = require('express'); // Express web server framework
var path = require('path'); // URI and local file paths
var cors = require('cors'); // Cross-origin resource sharing
var cookieParser = require('cookie-parser'); // Parsing and storing encrypted cookies
var vash = require('vash'); // Templating and building HTML files to render

// Custom Modules
const customModulePath = path.join(__dirname, 'modules');
var authorize = require(path.join(customModulePath, 'authorize.js'));
var error = require(path.join(customModulePath, 'error.js'));
var home = require(path.join(customModulePath, 'home.js'));
var login = require(path.join(customModulePath, 'login.js'));
var playlist = require(path.join(customModulePath, 'playlist.js'));

// Setup Page Handling
const staticFilesPath = path.join(__dirname, 'public');
const viewsFilesPath = path.join(__dirname, 'views');

var app = express();
app.use(express.static(staticFilesPath))
   .use(cors())
   .use(cookieParser());

 // Setup Templating Views
 app.set('view engine', 'vash')
    .set('views', viewsFilesPath);

// Home Logic
app.get('/home', home.getHomePage);

// Login Logic
app.get('/login', login.getLoginPage);
app.get('/validateLogin', login.validateLogin);

// Playlist Logic
app.get('/playlists', playlist.getAllPlaylistPage);
app.get('/playlist', playlist.getPlaylistPage);
app.get('/deletePlaylist', playlist.deletePlaylistPage);
app.get('/restorePlaylist', playlist.restorePlaylistPage);

// Authorization Logic
// TODO - For testing only, this should be called by other middleware when the access token is expired, not triggered directly through an endpoint
app.get('/authorize', authorize.getAuthorizationTokensViaRefresh)

// Error Handling
app.use('/access_denied', error.handleAccessNotAllowed);
app.use(error.handlePageNotFound);
app.use(error.handleUnexpectedError);

// Listening Port
console.log('Listening for requests on port 80');
app.listen(80);
