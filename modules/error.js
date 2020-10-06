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
    console.error(err.name + ' : ' + err.message);

    // TODO - Change this (eventually) to point to a nicer, static HTML 500 page instead
    res.location('error')
    res.sendStatus(500);
    next(err);
}
