// Script Logic
addOnClickEventListenerToElementById("loginToSpotifyButton", controlLoadingOfLoginLink);

// DOM Specific Logic
function controlLoadingOfLoginLink()
{
    var elementId = "loginToSpotifyButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}
