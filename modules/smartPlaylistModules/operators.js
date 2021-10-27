"use strict";

// Default Constant Values
const maximumRecursionLimit = 3;
const defaultRadixBase = 10;
const defaultFuzzyEquivalencePercentage = 0.01;

// Operators Logic
exports.equals = function(a, b)
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

    // If a is a decimal, use fuzzy equivalence
    // Fuzzy equivalence will be less than 1% difference between the numbers to say they are "basically" the same
    if (typeof a === "number" && parseFloat(a, defaultRadixBase) !== Math.floor(a))
    {
        return Math.abs(a - b) <= defaultFuzzyEquivalencePercentage;
    }

    // Otherwise, check exact equivalence (for strings and non-decimal numerics and the like)
    return a === b;
};

exports.notEquals = function(a, b)
{
    return !exports.equals(a, b);
};

exports.greaterThan = function(a, b)
{
    return a > b;
};

exports.greaterThanOrEqualTo = function(a, b)
{
    return exports.greaterThan(a, b) || exports.equals(a, b);
};

exports.lessThan = function(a, b)
{
    return a < b;
};

exports.lessThanOrEqualTo = function(a, b)
{
    return exports.lessThan(a, b) || exports.equals(a, b);
};

// Note - The verb "contains" implies a lot of different possibilities
// This function means to address as many of them as possible
exports.contains = function(a, b, recurseDepth = 0)
{
    // Base case exits if a is null or undefined or otherwise falsy, or if recurse depth is too large
    if (!a || recurseDepth > maximumRecursionLimit)
    {
        return false;
    }

    // Check for complete equivalence first (in objects, sets, arrays, and primitives) using equals
    if (exports.equals(a, b))
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
            if (exports.contains(elementOfA, b, recurseDepth + 1))
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
};

exports.doesNotContain = function(a, b)
{
    return !exports.contains(a, b);
};
