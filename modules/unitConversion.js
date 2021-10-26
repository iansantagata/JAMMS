"use strict";

// Default Constant Values
const secondsToMsecConversion = 1000;
const minutesToSecondsConversion = 60;
const hoursToMinutesConversion = 60;

// Unit Conversion Logic

// Single Step Conversions
exports.getMillisecondsFromSeconds = function(seconds)
{
    return seconds * secondsToMsecConversion;
}

exports.getSecondsFromMinutes = function(minutes)
{
    return minutes * minutesToSecondsConversion;
}

exports.getMinutesFromHours = function(hours)
{
    return hours * hoursToMinutesConversion;
}

exports.getSecondsFromMilliseconds = function(msec)
{
    return msec / secondsToMsecConversion;
}

exports.getMinutesFromSeconds = function(seconds)
{
    return seconds / minutesToSecondsConversion;
}

exports.getHoursFromMinutes = function(minutes)
{
    return minutes / hoursToMinutesConversion;
}

// Multiple Step Conversions
exports.getMillisecondsFromHours = function(hours)
{
    const minutes = exports.getMinutesFromHours(hours);
    return exports.getMillisecondsFromMinutes(minutes);
}

exports.getMillisecondsFromMinutes = function(minutes)
{
    const seconds = exports.getSecondsFromMinutes(minutes);
    return exports.getMillisecondsFromSeconds(seconds);
}

exports.getHoursFromMilliseconds = function(msec)
{
    const minutes = exports.getMinutesFromMilliseconds(msec);
    return exports.getHoursFromMinutes(minutes);
}

exports.getMinutesFromMilliseconds = function(msec)
{
    const seconds = exports.getSecondsFromMilliseconds(msec);
    return exports.getMinutesFromSeconds(seconds);
}
