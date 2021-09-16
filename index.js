/*
 * Main Node Application and Event Handler for JAMMS App
 */

 console.log('Starting application');

// Dependencies
var express = require('express'); // Express web server framework
var path = require('path'); // URI and local file paths
var cors = require('cors'); // Cross-origin resource sharing
var cookieParser = require('cookie-parser'); // Parsing and storing encrypted cookies
var vash = require('vash'); // Templating and building HTML files to render

// Inject Environment Variables from File (Development Only)
if (process.env.NODE_ENV !== 'production')
{
    require('dotenv').config();
}

// Custom Modules
const customModulePath = path.join(__dirname, 'modules');
var error = require(path.join(customModulePath, 'error.js'));
var home = require(path.join(customModulePath, 'home.js'));
var login = require(path.join(customModulePath, 'login.js'));
var logout = require(path.join(customModulePath, 'logout.js'));
var playlist = require(path.join(customModulePath, 'playlist.js'));
var smartPlaylist = require(path.join(customModulePath, 'smartPlaylist.js'));
var logger = require(path.join(customModulePath, 'logger.js'));

// Setup Page Handling
const staticFilesPath = path.join(__dirname, 'public');
const viewsFilesPath = path.join(__dirname, 'views');

var app = express();
app.use(express.static(staticFilesPath))
   .use(cors())
   .use(cookieParser())
   .use(express.urlencoded({ extended: true }));

 // Setup Templating Views
 app.set('view engine', 'vash')
    .set('views', viewsFilesPath);

// Home Logic
app.get('/', home.getLandingPage);
app.get('/home', home.getHomePage);

// Login Logic
app.get('/login', login.getLoginPage);
app.get('/validateLogin', login.validateLogin);
app.get('/logout', logout.getLogoutPage);

// Playlist Logic
app.get('/playlist', playlist.getPlaylistPage);
app.get('/playlists', playlist.getAllPlaylistPage);
app.get('/createPlaylist', playlist.createPlaylistPage);
app.get('/deletePlaylist', playlist.deletePlaylistPage);
app.get('/restorePlaylist', playlist.restorePlaylistPage);

app.post('/createPlaylist', playlist.createPlaylist);

// Smart Playlist Logic
app.get('/createSmartPlaylist', smartPlaylist.createSmartPlaylistPage);

app.post('/createSmartPlaylist', smartPlaylist.createSmartPlaylist);

// Error Handling
app.use('/accessDenied', error.handleAccessNotAllowed);
app.use('/error', error.handleExpectedError);
app.use(error.handlePageNotFound);
app.use(error.handleUnexpectedError);

// Listening Port
logger.logInfo('Listening for requests on port ' + process.env.PORT);
app.listen(process.env.PORT);
