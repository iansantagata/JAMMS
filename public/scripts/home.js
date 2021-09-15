// Script Logic
addOnClickEventListenerToElementById("seeAllPlaylistsButton", controlLoadingIndicatorWithText);
addOnClickEventListenerToElementById("createPlaylistButton", controlLoadingIndicatorWithText);
addOnClickEventListenerToElementById("createSmartPlaylistButton", controlLoadingIndicatorWithText);
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
