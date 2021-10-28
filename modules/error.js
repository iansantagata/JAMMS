"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
const login = require(path.join(customModulePath, "login.js"));

const accessDeniedStatusCode = 403;
const notFoundStatusCode = 404;
const serverErrorStatusCode = 500;

// Error Handling Logic
exports.handleAjaxError = async function(req, res)
{
    res.status(serverErrorStatusCode);
    res.json(null);
};

exports.handlePageNotFound = async function(req, res)
{
    const errorPageData = await getErrorPageData(req, res);

    res.location("notFound");
    res.status(notFoundStatusCode);
    res.render("notFound", errorPageData);
};

exports.handleAccessNotAllowed = async function(req, res)
{
    const errorPageData = await getErrorPageData(req, res);

    res.location("accessDenied");
    res.status(accessDeniedStatusCode);
    res.render("accessDenied", errorPageData);
};

exports.handleExpectedError = async function(req, res)
{
    const errorPageData = await getErrorPageData(req, res);

    res.location("error");
    res.status(serverErrorStatusCode);
    res.render("error", errorPageData);
};

exports.handleUnexpectedError = async function(err, req, res, next)
{
    const errorPageData = await getErrorPageData(req, res);

    res.location("error");
    res.status(serverErrorStatusCode);
    res.render("error", errorPageData);
    next(err);
};

// Helper Functions
async function getErrorPageData(req, res)
{
    const isUserLoggedIn = await login.isUserLoggedIn(req, res);
    const errorPageData = {
        isLoginError: !isUserLoggedIn
    };

    return errorPageData;
}
