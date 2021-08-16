// Error Handling Logic
exports.handlePageNotFound = function(req, res)
{
    res.location('notFound');
    res.status(404);
    res.render('notFound');
}

exports.handleAccessNotAllowed = function(req, res)
{
    res.location('accessDenied');
    res.status(403);
    res.render('accessDenied');
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
