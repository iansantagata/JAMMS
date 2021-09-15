// Script Logic
addOnClickListenersForPlaylistPerPageLinks();
addOnClickListenersForViewPlaylistLinks();
addOnClickListenersForPlaylistsPageNavigationLinks();

// DOM Specific Logic
function addOnClickListenersForViewPlaylistLinks()
{
    var playlistLinkNodes = document.querySelectorAll('[id^="viewPlaylistLink-"]');
    for (var playlistLinkNode of playlistLinkNodes)
    {
        addOnClickEventListenerToElement(playlistLinkNode, controlLoadingIndicatorWithText);
    }
}

function addOnClickListenersForPlaylistsPageNavigationLinks()
{
    var playlistsPageNavigationLinkNodes = document.querySelectorAll('[id^="playlistsPageNavigation-"]');
    for (var playlistsPageNavigationLink of playlistsPageNavigationLinkNodes)
    {
        // Do not want the text of these nodes to be replaced with loading text, so just use the spinner
        addOnClickEventListenerToElement(playlistsPageNavigationLink, controlLoadingIndicator);
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
