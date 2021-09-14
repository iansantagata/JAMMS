// Script Logic
addOnClickEventListenerToElementById("homeButton", controlLoadingOfHomeLink);
addOnClickEventListenerToElementById("logOutButton", controlLoadingOfLogOutLink);

// DOM Specific Logic
function controlLoadingOfHomeLink()
{
    var elementId = "homeButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}

function controlLoadingOfLogOutLink()
{
    var elementId = "logOutButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}
