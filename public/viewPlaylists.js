// Script Logic
addOnClickListenersForPlaylistPerPageLinks();
addOnClickListenersForViewPlaylistLinks();

// DOM Specific Logic
function addOnClickListenersForViewPlaylistLinks()
{
    var playlistLinkNodes = document.querySelectorAll('[id^="viewPlaylistLink-"]');
    for (var playlistLinkNode of playlistLinkNodes)
    {
        addOnClickEventListenerToElement(playlistLinkNode, controlLoadingIndicatorWithText);
    }
}

function addOnClickListenersForPlaylistPerPageLinks()
{
    var playlistsPerPageLinkNodes = document.querySelectorAll('[id^="playlistsPerPageLink-"]');
    for (var playlistsPerPageLink of playlistsPerPageLinkNodes)
    {
        // Seems somewhat strange, but with a dropdown of links, the desired behavior is for the
        // Parent element (button) to show a loading indicator, not each option (link) in the dropdown
        addOnClickEventListenerToElement(playlistsPerPageLink, controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown);
    }
}

function controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown()
{
    var elementId = "playlistsPerPageDropdown";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingIndicatorById(elementId, true);
}
