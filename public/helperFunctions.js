// Generalized Helper Functions
function addOnClickEventListenerToElementById(id, callback)
{
    var element = document.getElementById(id);

    // Only try to add event listeners when we actually find the target element
    if (element !== undefined && element !== null)
    {
        element.addEventListener("click", callback);
    }
}

function controlEnablementOfElementById(id)
{
    // First, handle the disabled attribute (generally for buttons)
    var element = document.getElementById(id);
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

function validateFormById(id)
{
    var element = document.getElementById(id);
    var isValid = element.checkValidity();
    return isValid;
}

function submitFormById(id)
{
    var element = document.getElementById(id);
    element.submit();
}

function replaceElementContentsWithLoadingSpinnerById(id)
{
    var element = document.getElementById(id);
    // Clear out all nesting of nodes within the node
    while (element.hasChildNodes())
    {
        element.removeChild(element.firstChild);
    }

    var spanSpinner = document.createElement("span");
    spanSpinner.setAttribute("class", "spinner-border spinner-border-sm");
    spanSpinner.setAttribute("role", "status");

    var textNode = document.createTextNode(" Loading... ");

    // Put the loading spinner and loading text into the node
    element.appendChild(spanSpinner);
    element.appendChild(textNode);
}
