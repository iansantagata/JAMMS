// Error Handling Logic
exports.handlePageNotFound = function(req, res)
{
    res.location('not_found');
    res.status(404);
    res.render('not_found');
}

exports.handleAccessNotAllowed = function(req, res)
{
    res.location('access_denied');
    res.status(403);
    res.render('access_denied');
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
