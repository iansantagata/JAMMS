// Script Logic
addOnClickListenersForPlaylistPerPageLinks();
addOnClickListenersForViewPlaylistLinks();

// DOM Specific Logic
function addOnClickListenersForViewPlaylistLinks()
{
    var playlistLinkNodes = document.querySelectorAll('[id^="viewPlaylistLink-"]');
    for (var playlistLinkNode of playlistLinkNodes)
    {
        var elementId = playlistLinkNode.id;
        addOnClickEventListenerToElementById(elementId, controlLoadingIndicatorWithText);
    }
}

function addOnClickListenersForPlaylistPerPageLinks()
{
    var playlistsPerPageLinkNodes = document.querySelectorAll('[id^="playlistsPerPageLink-"]');
    for (var playlistsPerPageLink of playlistsPerPageLinkNodes)
    {
        var elementId = playlistsPerPageLink.id;
        addOnClickEventListenerToElementById(elementId, controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown);
    }
}

function controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown()
{
    var elementId = "playlistsPerPageDropdown";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingSpinnerAndTextById(elementId);
}
