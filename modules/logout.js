// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));

// Logout Logic
exports.getLogoutPage = function(req, res)
{
    // Logging out just consists of removing cookies and redirecting to the landing page
    authorize.deleteAuthorizationCookies(req, res);

    var logoutPageData = {
        isAwaitingLogin: true
    };

    res.location('/');
    res.render('logout', logoutPageData);
}

// TODO - Should this clear Spotify cookies too so users can login to a different account if they choose?
