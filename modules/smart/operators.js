"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Custom Modules
const customModulePath = path.join(__dirname, "..");
const logger = require(path.join(customModulePath, "logger.js"));

// Operators Logic
function equals(a, b)
{
    // If a is an array, we want to look for an exact match in the array only
    if (Array.isArray(a))
    {
        return a.includes(b);
    }

    // If a is a set, we want to look for an exact match of the values in the set only
    if (a instanceof Set)
    {
        return a.has(b);
    }

    // If a is an object, we want to look for an exact match of the values of the object only
    if (typeof a === "object")
    {
        return Object
            .values(a)
            .includes(b);
    }

    // Otherwise, check exact equivalence (for strings and numerics and the like)
    return a === b;
}

function notEquals(a, b)
{
    return !equals(a, b);
}

function greaterThan(a, b)
{
    return a > b;
}

function greaterThanOrEqualTo(a, b)
{
    return greaterThan(a, b) || equals(a, b);
}

function lessThan(a, b)
{
    return a < b;
}

function lessThanOrEqualTo(a, b)
{
    return lessThan(a, b) || equals(a, b);
}

// Note - The verb "contains" implies a lot of different possibilities
// This function means to address as many of them as possible
function contains(a, b, recurseDepth = 0)
{
    // Base case exits if a is null or undefined or otherwise falsy, or if recurse depth is too large
    if (!a || recurseDepth > maximumRecursionLimit)
    {
        return false;
    }

    // Check for complete equivalence first (in objects, sets, arrays, and primitives) using equals
    if (equals(a, b))
    {
        return true;
    }

    // Without complete equivalence, now we want to check partial equivalence
    if (typeof a === "string")
    {
        return a.includes(b);
    }

    // Check partial equivalence in array elements as well
    if (Array.isArray(a))
    {
        // When input does not have exact data name, try recursion for sub-strings and sub-arrays and sub-objects as applicable
        for (const elementOfA of a)
        {
            if (contains(elementOfA, b, recurseDepth + 1))
            {
                // Break if a positive result is found to prevent further processing
                return true;
            }
        }

        // If no result came back positive for the array, then the target does not exist within the array
        return false;
    }

    // No case above applies, so fall back to a negative default case
    return false;
}

function doesNotContain(a, b)
{
    return !contains(a, b);
}
