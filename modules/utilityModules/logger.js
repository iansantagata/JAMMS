"use strict";

// Logger Logic
exports.logInfo = function(logMessage)
{
    const timeStamp = getTimeStamp();
    console.log(`[${timeStamp}] INFO: ${logMessage}`);
};

exports.logWarn = function(logMessage)
{
    const timeStamp = getTimeStamp();
    console.warn(`[${timeStamp}] WARN: ${logMessage}`);
};

exports.logError = function(logMessage)
{
    const timeStamp = getTimeStamp();
    console.error(`[${timeStamp}] ERROR: ${logMessage}`);
};

exports.logObjectDump = function(object)
{
    console.log(object);
};

// Local Helper Functions
function getTimeStamp()
{
    const currentDate = new Date();
    return currentDate.toISOString();
}
