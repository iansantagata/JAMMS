// Error Handling Logic
exports.handlePageNotFound = function(req, res)
{
    // TODO - Change this (eventually) to point to a nicer, static HTML 404 page instead
    res.location('not_found');
    res.sendStatus(404);
}

exports.handleAccessNotAllowed = function(req, res)
{
    // TODO - Change this (eventually) to point to a nicer, static HTML 403 page instead
    res.location('access_denied');
    res.sendStatus(403);
}

exports.handleUnexpectedError = function(err, req, res, next)
{
    // TODO - Eventually, log errors to a file on the server to have an error log
    // TODO - Change this (eventually) to point to a nicer, static HTML 500 page instead
    res.location('error')
    res.sendStatus(500);
    next(err);
}
