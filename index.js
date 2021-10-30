/*
 * Main Node Application and Event Handler for JAMMS App
 */

"use strict";

console.log("Starting application");

// Dependencies
const express = require("express"); // Express web server framework
const path = require("path"); // URI and local file paths
const cors = require("cors"); // Cross-origin resource sharing
const cookieParser = require("cookie-parser"); // Parsing and storing encrypted cookies
const helmet = require("helmet"); // HTTP header security

console.log("Imported major dependencies");

// Custom Modules
const customModulePath = path.join(__dirname, "modules");
const error = require(path.join(customModulePath, "error.js"));
const login = require(path.join(customModulePath, "login.js"));
const logout = require(path.join(customModulePath, "logout.js"));
const playlist = require(path.join(customModulePath, "playlist.js"));
const smartPlaylist = require(path.join(customModulePath, "smartPlaylist.js"));

// Request Modules
const requestModulesPath = path.join(customModulePath, "requestModules");
const landing = require(path.join(requestModulesPath, "landing.js"));
const home = require(path.join(requestModulesPath, "home.js"));

// Utility Modules
const utilityModulesPath = path.join(customModulePath, "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const environment = require(path.join(utilityModulesPath, "environment.js"));

logger.logInfo("Imported custom modules");

// Inject Environment Variables from File (Development Only)
const isDevelopmentEnvironment = environment.isDevelopmentEnvironmentSync();
if (isDevelopmentEnvironment)
{
    const dotenv = require("dotenv");
    dotenv.config({
        path: path.join(__dirname, "environment", "development.env")
    });

    logger.logInfo("Injected environment variables");
}

// Setup Page Handling
const staticFilesPath = path.join(__dirname, "public");
const viewsFilesPath = path.join(__dirname, "views");

// Setup Application
const cookieSigningKey = environment.getCookieSigningKeySync();

const helmetConfiguration = {
    contentSecurityPolicy: {
        directives: {
            "img-src": [
                "'self'",
                "data:",
                "*.scdn.co"
            ],
            "script-src": [
                "'self'",
                "'unsafe-inline'",
                "stackpath.bootstrapcdn.com",
                "code.jquery.com",
                "cdn.jsdelivr.net"
            ]
        },
        useDefaults: true
    }
};

const app = express();
app.use(express.static(staticFilesPath))
    .use(cors())
    .use(helmet(helmetConfiguration))
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
app.get("/deletePlaylist", playlist.deletePlaylistPage);
app.get("/restorePlaylist", playlist.restorePlaylistPage);

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
const port = environment.getPortSync();

logger.logInfo(`Listening for requests on port ${port}`);
app.listen(port);
