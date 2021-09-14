// Script Logic
addOnClickEventListenerToElementById("editPlaylistDetailsButton", controlLoadingOfEditPlaylistDetailsLink);
addOnClickEventListenerToElementById("restorePlaylistButton", controlLoadingOfRestorePlaylistLink);
addOnClickEventListenerToElementById("deletePlaylistButton", controlLoadingOfDeletePlaylistLink);

// DOM Specific Logic
function controlLoadingOfEditPlaylistDetailsLink()
{
    var elementId = "editPlaylistDetailsButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}

function controlLoadingOfRestorePlaylistLink()
{
    var elementId = "restorePlaylistButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}

function controlLoadingOfDeletePlaylistLink()
{
    var elementId = "deletePlaylistButton";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerById(elementId);
}
