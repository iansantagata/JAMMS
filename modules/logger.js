// Logger Logic
exports.logInfo = function(logMessage)
{
    var timeStamp = getTimeStamp();
    console.log(`[${timeStamp}] INFO: ${logMessage}`);
};

exports.logWarn = function(logMessage)
{
    var timeStamp = getTimeStamp();
    console.warn(`[${timeStamp}] WARN: ${logMessage}`);
};

exports.logError = function(logMessage)
{
    var timeStamp = getTimeStamp();
    console.error(`[${timeStamp}] ERROR: ${logMessage}`);
};

// Local Helper Functions
var getTimeStamp = function()
{
    return new Date().toISOString();
};
