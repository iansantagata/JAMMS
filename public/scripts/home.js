"use strict";

// Script Logic
addOnClickEventListenerToElementById("seeAllPlaylistsButton", controlLoadingIndicatorWithText);
addOnClickEventListenerToElementById("createSmartPlaylistButton", controlLoadingIndicatorWithText);
addOnClickListenersForViewPlaylistLinks();

// DOM Specific Logic
function addOnClickListenersForViewPlaylistLinks()
{
    const playlistLinkNodes = document.querySelectorAll("[id^='viewPlaylistLink-']");
    for (const playlistLinkNode of playlistLinkNodes)
    {
        addOnClickEventListenerToElement(playlistLinkNode, controlLoadingIndicatorWithText);
    }
}
