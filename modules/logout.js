// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));
var logger = require(path.join(customModulePath, 'logger.js'));

// Logout Logic
exports.logOut = async function(req, res, next)
{
    try
    {
        // Logging out just consists of removing cookies and redirecting to the landing page
        await authorize.deleteAuthorizationCookies(res);

        // Now that we have successfully logged out, redirect to the landing page
        res.redirect('/');
    }
    catch (error)
    {
        logger.logError('Failed to get log out page: ' + error.message);
        next(error);
        return;
    }
}

// TODO - Should this clear Spotify cookies too so users can login to a different account if they choose?
