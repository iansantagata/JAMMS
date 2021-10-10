// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var login = require(path.join(customModulePath, 'login.js'));
var logger = require(path.join(customModulePath, 'logger.js'));
var home = require(path.join(customModulePath, 'home.js'));

// Landing Logic
exports.getLandingPage = async function(req, res, next)
{
    try
    {
        // Try to get the home page if the user is already logged in or can authenticate
        var isUserLoggedIn = await login.isUserLoggedIn(req, res);
        if (!isUserLoggedIn)
        {
            throw new Error('User is not logged in. Falling back to landing page.');
        }

        var homePageData = await home.getHomePageData(req, res);
        home.renderHomePage(res, homePageData);
    }
    catch (homePageError)
    {
        try
        {
            // If authentication fails or the user has not logged in yet, try to send them to the landing page
            var landingPageData = {
                isAwaitingLogin: true
            };

            res.location('/');
            res.render('landing', landingPageData);
        }
        catch (landingPageError)
        {
            logger.logError('Failed to get home page from landing page: ' + homePageError.message);
            logger.logError('Failed to get landing page: ' + landingPageError.message);
            next(landingPageError);
            return;
        }
    }
}
