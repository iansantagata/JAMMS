"use strict";

const serverErrorStatusCode = 500;

// Error Handling Logic
exports.handleAjaxError = function(res)
{
    res.sendStatus(serverErrorStatusCode);
};
