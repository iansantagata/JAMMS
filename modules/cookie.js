// Cookie Logic

exports.getCookie = function(req, cookieName)
{
    if (req === undefined || req === null)
    {
        console.error("Failed to get cookie: No request found");
        return;
    }

    if (cookieName === undefined || cookieName === null)
    {
        console.error("Failed to get cookie: Cookie name not valid");
        return;
    }

    var cookieValue = req.cookies ? req.cookies[cookieName] : null;
    return cookieValue;
}

exports.setCookie = function(res, cookieName, cookieValue, cookieMaxAge)
{
    if (res === undefined || res === null)
    {
        console.error("Failed to set cookie: No response found");
        return;
    }

    if (cookieName === undefined || cookieName === null)
    {
        console.error("Failed to set cookie: Cookie name not valid");
        return;
    }

    if (cookieValue === undefined || cookieValue === null)
    {
        console.error("Failed to set cookie: Cookie value not valid");
        return;
    }

    if (cookieMaxAge === undefined || cookieMaxAge === null)
    {
        res.cookie(cookieName, cookieValue); // Set a session cookie (no explicit expiration)
    }
    else
    {
        var cookieOptions = {
            maxAge: cookieMaxAge
        };

        res.cookie(cookieName, cookieValue, cookieOptions);
    }
};

// TODO - Implement secure cookies (for usage over HTTPS)

exports.clearCookie = function(res, cookieName)
{
    if (res === undefined || res === null)
    {
        console.error("Failed to clear cookie: No response found");
        return;
    }

    if (cookieName === undefined || cookieName === null)
    {
        console.error("Failed to clear cookie: Cookie name not valid");
        return;
    }

    res.clearCookie(cookieName);
}
