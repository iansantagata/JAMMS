"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
const environment = require(path.join(customModulePath, "environment.js"));

// Utility Modules
const utilityModulesPath = path.join(__dirname, "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));

// Cookie Logic
exports.getCookie = function(req, cookieName)
{
    try
    {
        if (!req)
        {
            throw new Error("No request object found");
        }

        if (!cookieName)
        {
            throw new Error("Cookie name not valid");
        }

        if (!req.signedCookies)
        {
            // Do not want to log an error because this may be that a cookie
            // Just does not exist yet or does not exist intentionally
            const noCookiesExistError = new Error("No request cookies object found");
            logger.logInfo(`Failed to get cookie: ${noCookiesExistError.message}`);

            // We still want to indicate that the cookie value was not retrieved regardless
            return Promise.reject(noCookiesExistError);
        }

        const cookieValue = req.signedCookies[cookieName];
        if (!cookieValue)
        {
            // Do not want to log an error because this may be that a cookie
            // Just does not exist yet or does not exist intentionally
            const noCookieFoundError = new Error(`Cookie "${cookieName}" not found`);
            logger.logInfo(`Failed to get cookie: ${noCookieFoundError.message}`);

            // We still want to indicate that the cookie value was not retrieved regardless
            return Promise.reject(noCookieFoundError);
        }

        return Promise.resolve(cookieValue);
    }
    catch (error)
    {
        logger.logError(`Failed to get cookie: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.setCookie = function(req, res, cookieName, cookieValue, cookieSettings)
{
    try
    {
        if (!req)
        {
            throw new Error("No request object found");
        }

        if (!req.signedCookies)
        {
            throw new Error("No request cookies object found");
        }

        if (!res)
        {
            throw new Error("No response object found");
        }

        if (!cookieName)
        {
            throw new Error("Cookie name not valid");
        }

        if (!cookieValue)
        {
            throw new Error("Cookie value not valid");
        }

        // Only want to use HTTPS for cookies in Production
        const useSecureCookiesOverHttps = environment.isProductionEnvironmentSync();

        // Note - This field is poorly named in this package / library
        // Ensures that the cookie is only sent and accessed via HTTP(S) requests only by the web server and not through client JavaScript
        // Helps to prevent against cross-site scripting (XSS) attacks
        const useHttpOnlyFlag = true;

        // Declare that the cookies will be sent when users or sites are navigating to this application's web pages (from anywhere)
        // This needs to be 'Lax' instead of 'Strict' to allow cookies to be stored and accessed when logging into Spotify
        const sameSiteSetting = "Lax";

        // Sign cookies with a secret and read them back with the same secret to validate them
        const useSignedCookies = true;

        // Default cookie options, to be used as default if no settings are specified
        const defaultCookieOptions = {
            httpOnly: useHttpOnlyFlag,
            sameSite: sameSiteSetting,
            secure: useSecureCookiesOverHttps,
            signed: useSignedCookies
        };

        // Overwrite any default cookie option with ones manually specified
        const cookieOptions = {
            ...defaultCookieOptions,
            ...cookieSettings
        };

        res.cookie(cookieName, cookieValue, cookieOptions);

        // At this point, the cookie value is now set for subsequent requests
        // However, the request object does not have the updated cookie value for this request
        // Since it is desirable to retrieve data from cookies that have been set on this request,
        // Update the request object to include this newly set cookie for the current request
        req.signedCookies[cookieName] = cookieValue;

        // Does not return anything, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to set cookie: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.clearCookie = function(res, cookieName)
{
    try
    {
        if (!res)
        {
            throw new Error("No response object found");
        }

        if (!cookieName)
        {
            throw new Error("Cookie name not valid");
        }

        res.clearCookie(cookieName);

        // Does not return anything, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to clear cookie: ${error.message}`);
        return Promise.reject(error);
    }
};
