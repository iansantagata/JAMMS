"use strict";

// Generalized Helper Functions
function addOnClickEventListenerToElementById(id, callback)
{
    const element = document.getElementById(id);
    addOnClickEventListenerToElement(element, callback);
}

function addOnClickEventListenerToElement(element, callback)
{
    // Only try to add event listeners when we actually find the target element
    if (element)
    {
        element.addEventListener("click", callback);
    }
}

function addOnChangeEventListenerToElementById(id, callback)
{
    const element = document.getElementById(id);
    addOnChangeEventListenerToElement(element, callback);
}

function addOnChangeEventListenerToElement(element, callback)
{
    // Only try to add event listeners when we actually find the target element
    if (element)
    {
        element.addEventListener("change", callback);
    }
}

function checkResponseCodeValidity(response)
{
    if (!response)
    {
        throw new Error("Failed to fetch response");
    }

    if (!response.ok)
    {
        throw new Error(`Response unsuccessful with HTTP code ${response.status}`);
    }

    return response;
}

function controlEnablementOfElementById(id)
{
    const element = document.getElementById(id);
    controlEnablementOfElement(element);
}

function controlEnablementOfElement(element)
{
    // First, handle the disabled attribute (generally for buttons)
    const isDisabled = element.disabled;
    element.disabled = !isDisabled;

    // Next, handle the disabled value within the class attribute (generally for links)
    if (element.hasAttribute("class"))
    {
        const classAttribute = element.getAttribute("class");
        const classes = classAttribute.split(" ");
        if (classes.includes("disabled"))
        {
            // If the class already has disabled in it, remove it
            const disabledClassIndex = classes.indexOf("disabled");
            classes.splice(disabledClassIndex, 1);
            element.setAttribute("class", classes.join(" "));
        }
        else
        {
            // If the class does not have disabled in it, add it
            classes.push("disabled");
            element.setAttribute("class", classes.join(" "));
        }
    }
    else
    {
        // If no class attribute exists on the element, add it and the disabled value
        element.setAttribute("class", "disabled");
    }
}

function controlLoadingIndicator()
{
    const elementId = event.target.id;
    const element = document.getElementById(elementId);
    controlEnablementOfElement(element);
    replaceElementContentsWithLoadingIndicator(element, false);
}

function controlLoadingIndicatorWithText()
{
    const elementId = event.target.id;
    const element = document.getElementById(elementId);
    controlEnablementOfElement(element);
    replaceElementContentsWithLoadingIndicator(element, true);
}

function controlLoadingOfFormSubmitAction()
{
    const eventTargetId = event.target.id;
    const eventElement = document.getElementById(eventTargetId);

    const formElement = getClosestForm(eventElement);
    if (!formElement)
    {
        return;
    }

    const isValidForm = isFormValid(formElement);
    if (!isValidForm)
    {
        return;
    }

    controlEnablementOfElement(eventElement);
    replaceElementContentsWithLoadingIndicator(eventElement, true);

    formElement.submit();
}

function getClosestForm(element)
{
    const formElement = element.closest("form");
    return formElement;
}

function isFormValid(formElement)
{
    return formElement.checkValidity();
}

function removeChildElements(element)
{
    // Only try to remove child elements when we actually find the target element
    if (element)
    {
        // Clear out all nesting of nodes within the node
        while (element.hasChildNodes())
        {
            element.removeChild(element.firstChild);
        }
    }
}

function replaceElementContentsWithLoadingIndicatorById(id, showLoadingText)
{
    const element = document.getElementById(id);
    replaceElementContentsWithLoadingIndicator(element, showLoadingText);
}

function replaceElementContentsWithLoadingIndicator(element, showLoadingText)
{
    // Clear out all child elements
    removeChildElements(element);

    const spanSpinner = document.createElement("span");
    spanSpinner.setAttribute("class", "spinner-border spinner-border-sm");
    spanSpinner.setAttribute("role", "status");

    // Put the loading spinner and loading text (if required) into the node
    element.appendChild(spanSpinner);
    if (showLoadingText)
    {
        const textNode = document.createTextNode(" Loading... ");
        element.appendChild(textNode);
    }
}

function replaceElementContentsWithText(element, text)
{
    // Clear out all child elements
    removeChildElements(element);

    // Add the custom text into the node
    const textNode = document.createTextNode(text);
    element.appendChild(textNode);
}

function setImageSourceAttributeById(id, sourceValue)
{
    const element = document.getElementById(id);
    element.setAttribute("src", sourceValue);
}

function setTextInElementById(id, text)
{
    const element = document.getElementById(id);
    element.innerText = text;
}

// Spotify Object Specific Functions
function getCommaSeparatedArtistNames(artists)
{
    if (!artists)
    {
        return "";
    }

    // Smush all the artists of a track together into a comma separated string
    let artistNames = "";
    for (const artist of artists)
    {
        // Make sure the artist has a name, and if so, include it
        if (artist.name)
        {
            artistNames += `${artist.name}, `;
        }
    }

    // Remove the trailing comma and space (if there is one)
    const lastCommaIndex = artistNames.lastIndexOf(",");
    if (lastCommaIndex === -1)
    {
        return artistNames;
    }

    artistNames = artistNames.substring(0, lastCommaIndex);
    return artistNames;
}

function getImagePath(images, defaultImagePath)
{
    // Make sure we actually have images, or else we can short circuit
    if (!Array.isArray(images) || images.length === 0)
    {
        return defaultImagePath;
    }

    // Images are ordered from widest to smallest width, so select the first image to choose the widest one if one exists
    const targetImage = images[0];
    if (!targetImage)
    {
        return defaultImagePath;
    }


    // If URL is invalid, use the default image
    const targetImageUrl = targetImage.url;
    if (!targetImageUrl)
    {
        return defaultImagePath;
    }

    // The URL is a valid one, so use it to point to the biggest valid image
    return targetImage.url;
}

function getCamelCase(str)
{
    const nonAlphanumericRepeatingFollowedBySingleAlphanumericRegex = /[^a-zA-Z0-9]+(.)/g;

    return str
        // Convert the whole string to lower case
        .toLowerCase()

        // Convert only parts of the string that should be camel case capitalized with capitals
        .replace(
            nonAlphanumericRepeatingFollowedBySingleAlphanumericRegex,
            (match, chr) => chr.toUpperCase()
        );
}

function getShortenedNumericRepresentation(number, significantFigures)
{
    if (!number)
    {
        return number;
    }

    if (number !== Math.floor(number))
    {
        return number;
    }

    // Round the number to the specified number of significant figures
    const roundedNumber = number.toPrecision(significantFigures);

    const thousand = 1000;
    if (roundedNumber < thousand)
    {
        return roundedNumber;
    }

    const million = 1000000;
    if (roundedNumber < million)
    {
        const numberOfThousands = roundedNumber / thousand;
        return `${numberOfThousands}K`;
    }

    const billion = 1000000000;
    if (roundedNumber < billion)
    {
        const numberOfMillions = roundedNumber / million;
        return `${numberOfMillions}M`;
    }

    const numberOfBillions = roundedNumber / billion;
    return `${numberOfBillions}B`;
}
