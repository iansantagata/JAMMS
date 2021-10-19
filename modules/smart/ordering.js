"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Ordering Logic
function getOrderForTracks(targetTrackIndex, tracks, orderOfTracks, orderComparisonFunction)
{
    if (!Array.isArray(orderOfTracks))
    {
        return [];
    }

    if (typeof targetTrackIndex !== "number" || isNaN(targetTrackIndex))
    {
        return orderOfTracks;
    }

    if (!Array.isArray(tracks) || tracks.length <= 0)
    {
        return orderOfTracks;
    }

    if (typeof orderComparisonFunction !== "function")
    {
        return orderOfTracks;
    }

    // Figure out where this track goes in the existing ordering
    let targetOrderIndex = 0;
    let lowerBoundInclusive = 0;
    let upperBoundExclusive = orderOfTracks.length;
    const trackToInsert = tracks[targetTrackIndex];

    // Converge on the location to insert by moving the bounds until they are equal
    while (lowerBoundInclusive !== upperBoundExclusive)
    {
        // Grab the closest approximation to the middle index in the remaining bounded range
        // This is done in order to shrink the search space and use O(log(n)) instead of O(n)
        targetOrderIndex = upperBoundExclusive - 1 - Math.floor((upperBoundExclusive - lowerBoundInclusive) / 2);

        // Use the order index to retrieve the target track
        const targetTrack = tracks[orderOfTracks[targetOrderIndex]];

        // Compare the track to be inserted against the track at the current index
        const comparisonResult = orderComparisonFunction(trackToInsert, targetTrack);

        // Track to insert should come in order before the target track
        if (comparisonResult < 0)
        {
            upperBoundExclusive = targetOrderIndex;
        }

        // Track to insert should come in order after the target track
        else if (comparisonResult > 0)
        {
            lowerBoundInclusive = targetOrderIndex + 1;
        }

        // Track to insert is equivalent in order to the target track
        else
        {
            lowerBoundInclusive = targetOrderIndex;
            upperBoundExclusive = targetOrderIndex;
        }
    }

    // Insert into the order array, pushing everything at the index (inclusive) back
    targetOrderIndex = lowerBoundInclusive;
    orderOfTracks.splice(targetOrderIndex, 0, targetTrackIndex);
    return orderOfTracks;
}

function getOrderingFunction(orderField, orderDirection)
{
    let orderingFunction = () => {};

    switch (orderField)
    {
        case "artist":
            orderingFunction = getOrderingFunctionByDirection(compareByArtistAscending, compareByArtistDescending, orderDirection);
            break;

        case "album":
            orderingFunction = getOrderingFunctionByDirection(compareByAlbumAscending, compareByAlbumDescending, orderDirection);
            break;

        case "release date":
            orderingFunction = getOrderingFunctionByDirection(compareByReleaseAscending, compareByReleaseDescending, orderDirection);
            break;

        case "duration":
            orderingFunction = getOrderingFunctionByDirection(compareByDurationAscending, compareByDurationDescending, orderDirection);
            break;

        case "library add date":
            orderingFunction = getOrderingFunctionByDirection(compareByLibraryAscending, compareByLibraryDescending, orderDirection);
            break;

        case "popularity":
            orderingFunction = getOrderingFunctionByDirection(compareByPopularityAscending, compareByPopularityDescending, orderDirection);
            break;

        case "song":
        default:
            orderingFunction = getOrderingFunctionByDirection(compareBySongAscending, compareBySongDescending, orderDirection);
            break;
    }

    return orderingFunction;
}

function getOrderingFunctionByDirection(ascendingFunction, descendingFunction, direction)
{
    let orderingFunctionByDirection = () => {};

    switch (direction)
    {
        case "descending":
            orderingFunctionByDirection = descendingFunction;
            break;

        case "ascending":
        default:
            orderingFunctionByDirection = ascendingFunction;
            break;
    }

    return orderingFunctionByDirection;
}
