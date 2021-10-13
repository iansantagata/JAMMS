"use strict";

// Script Logic
addOnClickListenersForPlaylistPerPageLinks();
addOnClickListenersForViewPlaylistLinks();
addOnClickListenersForPlaylistsPageNavigationLinks();

// DOM Specific Logic
function addOnClickListenersForViewPlaylistLinks()
{
    const playlistLinkNodes = document.querySelectorAll("[id^=\"viewPlaylistLink-\"]");
    for (const playlistLinkNode of playlistLinkNodes)
    {
        addOnClickEventListenerToElement(playlistLinkNode, controlLoadingIndicatorWithText);
    }
}

function addOnClickListenersForPlaylistsPageNavigationLinks()
{
    const playlistsPageNavigationLinkNodes = document.querySelectorAll("[id^=\"playlistsPageNavigation-\"]");
    for (const playlistsPageNavigationLink of playlistsPageNavigationLinkNodes)
    {
        // Do not want the text of these nodes to be replaced with loading text, so just use the spinner
        addOnClickEventListenerToElement(playlistsPageNavigationLink, controlLoadingIndicator);
    }
}

function addOnClickListenersForPlaylistPerPageLinks()
{
    const playlistsPerPageLinkNodes = document.querySelectorAll("[id^=\"playlistsPerPageLink-\"]");
    for (const playlistsPerPageLink of playlistsPerPageLinkNodes)
    {
        // Seems somewhat strange, but with a dropdown of links, the desired behavior is for the
        // Parent element (button) to show a loading indicator, not each option (link) in the dropdown
        addOnClickEventListenerToElement(playlistsPerPageLink, controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown);
    }
}

function controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown()
{
    const elementId = "playlistsPerPageDropdown";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingIndicatorById(elementId, true);
}
