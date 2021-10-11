/*
 * Main Node Application and Event Handler for JAMMS App
 */

console.log("Starting application");

// Dependencies
var express = require("express"); // Express web server framework
var path = require("path"); // URI and local file paths
var cors = require("cors"); // Cross-origin resource sharing
var cookieParser = require("cookie-parser"); // Parsing and storing encrypted cookies

console.log("Imported major dependencies");

// Custom Modules
const customModulePath = path.join(__dirname, "modules");
var error = require(path.join(customModulePath, "error.js"));
var home = require(path.join(customModulePath, "home.js"));
var landing = require(path.join(customModulePath, "landing.js"));
var login = require(path.join(customModulePath, "login.js"));
var logout = require(path.join(customModulePath, "logout.js"));
var playlist = require(path.join(customModulePath, "playlist.js"));
var smartPlaylist = require(path.join(customModulePath, "smartPlaylist.js"));
var logger = require(path.join(customModulePath, "logger.js"));
var environment = require(path.join(customModulePath, "environment.js"));

logger.logInfo("Imported custom modules");

// Inject Environment Variables from File (Development Only)
var isDevelopmentEnvironment = environment.isDevelopmentEnvironmentSync();
if (isDevelopmentEnvironment)
{
    require("dotenv").config();
    logger.logInfo("Injected environment variables");
}

// Setup Page Handling
const staticFilesPath = path.join(__dirname, "public");
const viewsFilesPath = path.join(__dirname, "views");

// Setup Application
var cookieSigningKey = environment.getCookieSigningKeySync();

var app = express();
app.use(express.static(staticFilesPath))
    .use(cors())
    .use(cookieParser(cookieSigningKey))
    .use(express.json())
    .use(express.urlencoded({ extended: true }));

// Setup Templating Views
app.set("view engine", "vash")
    .set("views", viewsFilesPath);

logger.logInfo("Set up application");

// Endpoint Routing
// Landing Page and Home Page Logic
app.get("/", landing.getLandingPage);
app.get("/home", home.getHomePage);

// Login / Logout Logic
app.get("/login", login.getLoginPage);
app.get("/validateLogin", login.validateLogin);
app.get("/logout", logout.logOut);

// Playlist Logic
app.get("/playlist", playlist.getPlaylistPage);
app.get("/playlists", playlist.getAllPlaylistPage);
app.get("/createPlaylist", playlist.createPlaylistPage);
app.get("/deletePlaylist", playlist.deletePlaylistPage);
app.get("/restorePlaylist", playlist.restorePlaylistPage);
app.post("/createPlaylist", playlist.createPlaylist);

// Smart Playlist Logic
app.get("/createSmartPlaylist", smartPlaylist.createSmartPlaylistPage);
app.post("/createSmartPlaylist", smartPlaylist.createSmartPlaylist);
app.post("/getSmartPlaylistPreview", smartPlaylist.getSmartPlaylistPreview);

logger.logInfo("Set up endpoint routing");

// Error Handling
app.use("/accessDenied", error.handleAccessNotAllowed);
app.use("/error", error.handleExpectedError);
app.use(error.handlePageNotFound);
app.use(error.handleUnexpectedError);

logger.logInfo("Set up error handling");

// Listening Port
var port = environment.getPortSync();

logger.logInfo("Listening for requests on port " + port);
app.listen(port);
