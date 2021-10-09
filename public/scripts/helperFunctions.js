// Generalized Helper Functions
function addOnClickEventListenerToElementById(id, callback)
{
    var element = document.getElementById(id);
    addOnClickEventListenerToElement(element, callback);
}

function addOnClickEventListenerToElement(element, callback)
{
    // Only try to add event listeners when we actually find the target element
    if (element !== undefined && element !== null)
    {
        element.addEventListener("click", callback);
    }
}

function controlEnablementOfElementById(id)
{
    var element = document.getElementById(id);
    controlEnablementOfElement(element);
}

function controlEnablementOfElement(element)
{
    // First, handle the disabled attribute (generally for buttons)
    var isDisabled = element.disabled;
    element.disabled = !isDisabled;

    // Next, handle the disabled value within the class attribute (generally for links)
    if (element.hasAttribute("class"))
    {
        var classAttribute = element.getAttribute("class");
        var classes = classAttribute.split(" ");
        if (classes.includes("disabled"))
        {
            // If the class already has disabled in it, remove it
            var disabledClassIndex = classes.indexOf("disabled");
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
    var elementId = event.target.id;
    var element = document.getElementById(elementId);
    controlEnablementOfElement(element);
    replaceElementContentsWithLoadingIndicator(element, false);
}

function controlLoadingIndicatorWithText()
{
    var elementId = event.target.id;
    var element = document.getElementById(elementId);
    controlEnablementOfElement(element);
    replaceElementContentsWithLoadingIndicator(element, true);
}

function controlLoadingOfFormSubmitAction()
{
    var eventTargetId = event.target.id;
    var eventElement = document.getElementById(eventTargetId);

    var formElement = getClosestForm(eventElement);
    if (formElement === null)
    {
        return;
    }

    var isValidForm = isFormValid(formElement);
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
    var formElement = element.closest("form");
    return formElement;
}

function isFormValid(formElement)
{
    return formElement.checkValidity();
}

function replaceElementContentsWithLoadingIndicatorById(id, showLoadingText)
{
    var element = document.getElementById(id);
    replaceElementContentsWithLoadingIndicator(element, showLoadingText);
}

function replaceElementContentsWithLoadingIndicator(element, showLoadingText)
{
    // Clear out all nesting of nodes within the node
    while (element.hasChildNodes())
    {
        element.removeChild(element.firstChild);
    }

    var spanSpinner = document.createElement("span");
    spanSpinner.setAttribute("class", "spinner-border spinner-border-sm");
    spanSpinner.setAttribute("role", "status");

    if (showLoadingText)
    {
        var textNode = document.createTextNode(" Loading... ");
    }

    // Put the loading spinner and loading text (if required) into the node
    element.appendChild(spanSpinner);
    if (showLoadingText)
    {
        element.appendChild(textNode);
    }
}

function replaceElementContentsWithText(element, text)
{
    // Clear out all nesting of nodes within the node
    while (element.hasChildNodes())
    {
        element.removeChild(element.firstChild);
    }

    // Add the custom text into the node
    var textNode = document.createTextNode(text);
    element.appendChild(textNode);
}

// Spotify Object Specific Functions
function getCommaSeparatedArtistNames(artists)
{
    if (artists === undefined || artists === null)
    {
        return "";
    }

    // Smush all the artists of a track together into a comma separated string
    var artistNames = "";
    for (var artist of artists)
    {
        // Make sure the artist has a name, and if not, do not include it
        if (artist.name !== undefined || artist.name !== null || artist.name !== "")
        {
            artistNames = artistNames + artist.name + ", ";
        }
    }

    // Remove the trailing comma and space (if there is one)
    var lastCommaIndex = artistNames.lastIndexOf(",");
    if (lastCommaIndex === -1)
    {
        return artistNames;
    }

    artistNames = artistNames.substring(0, lastCommaIndex);
    return artistNames;
}

function getImagePath(images, minimumPixelsPerSide, defaultImagePath)
{
    // Make sure we actually have images, or else we can short circuit
    if (images === undefined || images === null || images.length === 0)
    {
        return defaultImagePath;
    }

    // Images are ordered from widest to smallest width, so start at the end to keep images small-ish yet reasonably visible
    var imageIndex = images.length - 1;

    // We want images that are at least over the minimum pixels in both dimensions for the user to see them
    // If there are none, we will end up using the first and biggest image
    while (imageIndex < 0)
    {
        // If the image is not valid, keep going to the next image
        var image = images[imageIndex];
        if (image === undefined || image === null)
        {
            imageIndex--;
            continue;
        }

        // Make sure the image has all the information we need
        var hasWidth = image.width !== undefined && image.width !== null;
        var hasHeight = image.height !== undefined && image.height !== null;
        var hasUrl = image.url !== undefined && image.url !== null && image.url !== "";

        if (!hasWidth || !hasHeight || !hasUrl)
        {
            imageIndex--;
            continue;
        }

        // Make sure the image can satisfy the minimum bounds
        if (image.width >= minimumPixelsPerSide && image.height >= minimumPixelsPerSide)
        {
            // We have found our image index so we can exit the loop
            break;
        }

        imageIndex = imageIndex - 1;
    }

    // Image was not found, so use the default image
    var targetImage = images[imageIndex];
    if (targetImage === undefined || targetImage === null)
    {
        return defaultImagePath;
    }


    // The URL was invalid, so use the default image
    var targetImageUrl = targetImage.url;
    if (targetImageUrl === undefined || targetImageUrl === null || targetImageUrl === "")
    {
        return defaultImagePath;
    }

    // The URL is a valid one, so use it to point to the biggest valid image
    return targetImage.url;
}
