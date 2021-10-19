// Generic Helper Functions
function getArrayChunks(inputArray, chunkSize)
{
    if (!Array.isArray(inputArray))
    {
        throw new Error("Cannot chunk a non-array input");
    }

    if (chunkSize <= 0)
    {
        throw new Error("Cannot chunk array input into chunks of size less than one");
    }

    if (inputArray.length === 0)
    {
        return inputArray;
    }

    const arrayInChunks = [];

    const inputLength = inputArray.length;
    let index = 0;

    while (index < inputLength)
    {
        const chunk = inputArray.slice(index, index + chunkSize);
        arrayInChunks.push(chunk);

        index += chunkSize;
    }

    return arrayInChunks;
}
