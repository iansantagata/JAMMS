// Generalized Helper Functions
function addOnClickEventListenerToElementById(id, callback)
{
    var element = document.getElementById(id);
    element.addEventListener("click", callback);
}

function controlEnablementOfElementById(id)
{
    var element = document.getElementById(id);
    var isDisabled = element.disabled;
    element.disabled = !isDisabled;
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
