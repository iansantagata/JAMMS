// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var login = require(path.join(customModulePath, 'login.js'));

// Error Handling Logic
exports.handlePageNotFound = async function(req, res)
{
    var errorPageData = await getErrorPageData(req, res);

    res.location('notFound');
    res.status(404);
    res.render('notFound', errorPageData);
}

exports.handleAccessNotAllowed = async function(req, res)
{
    var errorPageData = await getErrorPageData(req, res);

    res.location('accessDenied');
    res.status(403);
    res.render('accessDenied', errorPageData);
}

exports.handleExpectedError = async function(req, res)
{
    var errorPageData = await getErrorPageData(req, res);

    res.location('error');
    res.status(500);
    res.render('error', errorPageData);
}

exports.handleUnexpectedError = async function(err, req, res, next)
{
    var errorPageData = await getErrorPageData(req, res);

    res.location('error')
    res.status(500);
    res.render('error', errorPageData);
    next(err);
}

// Helper Functions
async function getErrorPageData(req, res)
{
    var isUserLoggedIn = await login.isUserLoggedIn(req, res);
    var errorPageData = {
        isLoginError: !isUserLoggedIn
    }

    return errorPageData;
}
