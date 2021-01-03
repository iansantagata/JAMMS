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

exports.handleExpectedError = function(req, res)
{
    res.location('error');
    res.status(500);
    res.render('error');
}

exports.handleUnexpectedError = function(err, req, res, next)
{
    // TODO - Eventually, log errors to a file on the server to have an error log
    res.location('error')
    res.status(500);
    res.render('error');
    next(err);
}
