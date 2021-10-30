"use strict";

// Dependencies
const path = require("path"); // URI and local file paths
const probe = require("probe-image-size"); // Image dimensional details

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));

// Image Utilities Logic
exports.getMissingImageDimensionsForPlaylists = async function(playlists)
{
    if (!playlists)
    {
        return playlists;
    }

    for (const playlist of playlists)
    {
        if (!playlist)
        {
            continue;
        }

        const images = playlist.images;
        playlist.images = await exports.getMissingImageDimensions(images);
    }

    return playlists;
};

exports.getMissingImageDimensions = async function(images)
{
    if (!images)
    {
        return images;
    }

    for (const image of images)
    {
        if (!image)
        {
            continue;
        }

        // With an image url but no dimensions, make sure dimensions are populated
        if (image.url && (!image.width || !image.height))
        {
            try
            {
                const probeResult = await probe(image.url);

                // If probe was successful, set the dimension fields on the image
                image.width = probeResult.width;
                image.height = probeResult.height;
            }
            catch (error)
            {
                // Do not want to throw an error here because we have a fallback default image already
                logger.logWarn(`Failed to probe image dimensions: ${error.message}`);
                continue;
            }
        }
    }

    return images;
};
