// Encoding Logic
exports.encodeInBase64 = function(stringToEncode)
{
    try
    {
        return Promise.resolve(Buffer
            .from(stringToEncode, "utf8")
            .toString("base64"));
    }
    catch (error)
    {
        logger.logError(`Failed to base 64 encode string: ${stringToEncode}`);
        return Promise.reject(error);
    }
}
