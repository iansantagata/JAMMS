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
    var eventElementId = event.target.id;
    var eventElement = document.getElementById(eventElementId);

    var formElement = eventElement.closest("form");
    if (formElement === null)
    {
        return;
    }

    var isFormValid = formElement.checkValidity();
    if (!isFormValid)
    {
        return;
    }

    controlEnablementOfElement(eventElement);
    replaceElementContentsWithLoadingIndicator(eventElement, true);

    formElement.submit();
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
