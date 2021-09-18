// Dependencies
var path = require('path'); // URI and local file paths

// Custom Modules
const customModulePath = __dirname;
var logger = require(path.join(customModulePath, 'logger.js'));

// Cookie Logic
exports.getCookie = function(req, cookieName)
{
    try
    {
        if (req === undefined || req === null)
        {
            throw new Error('No request object found');
        }

        if (cookieName === undefined || cookieName === null)
        {
            throw new Error('Cookie name not valid');
        }

        var cookieValue = req.cookies ? req.cookies[cookieName] : null;
        if (cookieValue === undefined || cookieValue === null)
        {
            // Do not want to log an error because this may be that a cookie
            // Just does not exist yet or does not exist intentionally
            var handledError = new Error('Cookie \"' + cookieName + '\" not found');
            logger.logInfo('Failed to get cookie: ' + handledError.message);

            // We still want to indicate that the cookie value was not retrieved regardless
            return Promise.reject(handledError);
        }

        return Promise.resolve(cookieValue);
    }
    catch (error)
    {
        logger.logError('Failed to get cookie: ' + error.message);
        return Promise.reject(error);
    }
}

exports.setCookie = function(req, res, cookieName, cookieValue, cookieMaxAge)
{
    try
    {
        if (req === undefined || req === null)
        {
            throw new Error('No request object found');
        }

        if (req.cookies === undefined || req.cookies === null)
        {
            throw new Error('No request cookies object found');
        }

        if (res === undefined || res === null)
        {
            throw new Error('No response object found');
        }

        if (cookieName === undefined || cookieName === null)
        {
            throw new Error('Cookie name not valid');
        }

        if (cookieValue === undefined || cookieValue === null)
        {
            throw new Error('Cookie value not valid');
        }

        // Only want to use HTTPS for cookies in Production
        var useSecureCookiesOverHttps = process.env.NODE_ENV === 'production';

        // Note - This field is poorly named in this package / library
        // Ensures that the cookie is only sent and accessed via HTTP(S) requests only by the web server and not through client JavaScript
        // Helps to prevent against cross-site scripting (XSS) attacks
        var useHttpOnlyFlag = true;

        var cookieOptions = {
            secure: useSecureCookiesOverHttps,
            httpOnly: useHttpOnlyFlag
        };

        // Session cookies do not have an explicit expiration
        // Only set an expiration if one exists (and thus this is not a session cookie)
        if (cookieMaxAge !== undefined && cookieMaxAge !== null)
        {
            cookieOptions['maxAge'] = cookieMaxAge;
        }

        res.cookie(cookieName, cookieValue, cookieOptions);

        // At this point, the cookie value is now set for subsequent requests
        // However, the request object does not have the updated cookie value for this request
        // Since it is desirable to retrieve data from cookies that have been set on this request,
        // Update the request object to include this newly set cookie for the current request
        req.cookies[cookieName] = cookieValue;

        // Does not return anything, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError('Failed to set cookie: ' + error.message);
        return Promise.reject(error);
    }
};

// TODO - Implement secure cookies (for usage over HTTPS)

exports.clearCookie = function(res, cookieName)
{
    try
    {
        if (res === undefined || res === null)
        {
            throw new Error('No response object found');
        }

        if (cookieName === undefined || cookieName === null)
        {
            throw new Error('Cookie name not valid');
        }

        res.clearCookie(cookieName);

        // Does not return anything, just indicate success
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError('Failed to clear cookie: ' + error.message);
        return Promise.reject(error);
    }
}
