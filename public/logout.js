// Script Logic
addOnClickEventListenerToElementById("loginButton", controlLoadingOfLoginLink);

// DOM Specific Logic
function controlLoadingOfLoginLink()
{
    var elementId = "loginButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}
