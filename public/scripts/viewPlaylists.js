"use strict";

// Script Logic
addOnClickListenersForPlaylistPerPageLinks();
addOnClickListenersForViewPlaylistLinks();

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

function addPageNavigationButtons(currentPageNumber, numberOfPlaylistsPerPage, maxNumberOfPages)
{
    // Briefly handle edge cases (which should throw errors on the back end)
    if (currentPageNumber <= 0 || currentPageNumber > maxNumberOfPages)
    {
        return;
    }

    // Define some constants across most of the navigation elements
    const linkClassAttribute = "page-link";
    const enabledItemClassAttribute = "page-item";
    const disabledItemClassAttribute = "page-item disabled";
    const disabledUrl = "#";

    // Start by grabbing the container where we will shove these elements as they are built
    const pageNavigationContainerElement = document.getElementById("pageNavigationContainer");

    // Build a navigation for "Previous" to go to the previous page
    const canAccessPreviousPage = currentPageNumber > 1;
    const previousPageNumber = currentPageNumber - 1;
    const previousPageUrl = canAccessPreviousPage
        ? getPlaylistsPageNavigationUrl(previousPageNumber, numberOfPlaylistsPerPage)
        : disabledUrl;

    const previousPageLinkElement = document.createElement("a");
    previousPageLinkElement.setAttribute("id", "playlistsPageNavigation-previous");
    previousPageLinkElement.setAttribute("class", linkClassAttribute);
    previousPageLinkElement.setAttribute("href", previousPageUrl);
    previousPageLinkElement.innerText = "Previous";

    const previousPageListElement = document.createElement("li");
    const previousPageListClassAttribute = canAccessPreviousPage ? enabledItemClassAttribute : disabledItemClassAttribute;
    previousPageListElement.setAttribute("class", previousPageListClassAttribute);
    previousPageListElement.appendChild(previousPageLinkElement);

    pageNavigationContainerElement.appendChild(previousPageListElement);

    // Build a navigation for two pages back (if applicable)
    const twoPagesBackPageNumber = currentPageNumber - 2;
    const canAccessTwoPagesBack = twoPagesBackPageNumber >= 1;
    if (canAccessTwoPagesBack)
    {
        const twoPagesBackUrl = getPlaylistsPageNavigationUrl(twoPagesBackPageNumber, numberOfPlaylistsPerPage);

        const twoPagesBackLinkElement = document.createElement("a");
        twoPagesBackLinkElement.setAttribute("id", "playlistsPageNavigation-backTwo");
        twoPagesBackLinkElement.setAttribute("class", linkClassAttribute);
        twoPagesBackLinkElement.setAttribute("href", twoPagesBackUrl);
        twoPagesBackLinkElement.innerText = twoPagesBackPageNumber;

        const twoPagesBackListElement = document.createElement("li");
        twoPagesBackListElement.setAttribute("class", enabledItemClassAttribute);
        twoPagesBackListElement.appendChild(twoPagesBackLinkElement);

        pageNavigationContainerElement.appendChild(twoPagesBackListElement);
    }

    // Build a navigation for one page back (if applicable), similar to "Previous"
    const onePageBackPageNumber = currentPageNumber - 1;
    const canAccessOnePageBack = onePageBackPageNumber >= 1;
    if (canAccessOnePageBack)
    {
        const onePageBackUrl = getPlaylistsPageNavigationUrl(onePageBackPageNumber, numberOfPlaylistsPerPage);

        const onePageBackLinkElement = document.createElement("a");
        onePageBackLinkElement.setAttribute("id", "playlistsPageNavigation-backOne");
        onePageBackLinkElement.setAttribute("class", linkClassAttribute);
        onePageBackLinkElement.setAttribute("href", onePageBackUrl);
        onePageBackLinkElement.innerText = onePageBackPageNumber;

        const onePageBackListElement = document.createElement("li");
        onePageBackListElement.setAttribute("class", enabledItemClassAttribute);
        onePageBackListElement.appendChild(onePageBackLinkElement);

        pageNavigationContainerElement.appendChild(onePageBackListElement);
    }

    // Build a navigation for the current page
    const currentPageStrongElement = document.createElement("strong");
    currentPageStrongElement.innerText = currentPageNumber;

    const currentPageLinkElement = document.createElement("a");
    currentPageLinkElement.setAttribute("class", linkClassAttribute);
    currentPageLinkElement.setAttribute("href", disabledUrl);
    currentPageLinkElement.appendChild(currentPageStrongElement);

    const currentPageListElement = document.createElement("li");
    currentPageListElement.setAttribute("class", enabledItemClassAttribute);
    currentPageListElement.appendChild(currentPageLinkElement);

    pageNavigationContainerElement.appendChild(currentPageListElement);

    // Build a navigation for one page forward (if applicable), similar to "Next"
    const onePageForwardPageNumber = currentPageNumber + 1;
    const canAccessOnePageForward = onePageForwardPageNumber <= maxNumberOfPages;
    if (canAccessOnePageForward)
    {
        const onePageForwardUrl = getPlaylistsPageNavigationUrl(onePageForwardPageNumber, numberOfPlaylistsPerPage);

        const onePageForwardLinkElement = document.createElement("a");
        onePageForwardLinkElement.setAttribute("id", "playlistsPageNavigation-forwardOne");
        onePageForwardLinkElement.setAttribute("class", linkClassAttribute);
        onePageForwardLinkElement.setAttribute("href", onePageForwardUrl);
        onePageForwardLinkElement.innerText = onePageForwardPageNumber;

        const onePageForwardListElement = document.createElement("li");
        onePageForwardListElement.setAttribute("class", enabledItemClassAttribute);
        onePageForwardListElement.appendChild(onePageForwardLinkElement);

        pageNavigationContainerElement.appendChild(onePageForwardListElement);
    }

    // Build a navigation for two pages forward (if applicable)
    const twoPagesForwardPageNumber = currentPageNumber + 2;
    const canAccessTwoPagesForward = twoPagesForwardPageNumber <= maxNumberOfPages;
    if (canAccessTwoPagesForward)
    {
        const twoPagesForwardUrl = getPlaylistsPageNavigationUrl(twoPagesForwardPageNumber, numberOfPlaylistsPerPage);

        const twoPagesForwardLinkElement = document.createElement("a");
        twoPagesForwardLinkElement.setAttribute("id", "playlistsPageNavigation-forwardTwo");
        twoPagesForwardLinkElement.setAttribute("class", linkClassAttribute);
        twoPagesForwardLinkElement.setAttribute("href", twoPagesForwardUrl);
        twoPagesForwardLinkElement.innerText = twoPagesForwardPageNumber;

        const twoPagesForwardListElement = document.createElement("li");
        twoPagesForwardListElement.setAttribute("class", enabledItemClassAttribute);
        twoPagesForwardListElement.appendChild(twoPagesForwardLinkElement);

        pageNavigationContainerElement.appendChild(twoPagesForwardListElement);
    }

    // Build a navigation for "Next" to go to the next page
    const canAccessNextPage = currentPageNumber < maxNumberOfPages;
    const nextPageNumber = currentPageNumber + 1;
    const nextPageUrl = canAccessNextPage
        ? getPlaylistsPageNavigationUrl(nextPageNumber, numberOfPlaylistsPerPage)
        : disabledUrl;

    const nextPageLinkElement = document.createElement("a");
    nextPageLinkElement.setAttribute("id", "playlistsPageNavigation-next");
    nextPageLinkElement.setAttribute("class", linkClassAttribute);
    nextPageLinkElement.setAttribute("href", nextPageUrl);
    nextPageLinkElement.innerText = "Next";

    const nextPageListElement = document.createElement("li");
    const nextPageListClassAttribute = canAccessNextPage ? enabledItemClassAttribute : disabledItemClassAttribute;
    nextPageListElement.setAttribute("class", nextPageListClassAttribute);
    nextPageListElement.appendChild(nextPageLinkElement);

    pageNavigationContainerElement.appendChild(nextPageListElement);

    // Finally, make sure that all of the necessary elements have event handlers
    addOnClickListenersForPlaylistsPageNavigationLinks();
}

function getPlaylistsPageNavigationUrl(targetPageNumber, numberOfPlaylistsPerPage)
{
    return `/playlists?pageNumber=${targetPageNumber}&playlistsPerPage=${numberOfPlaylistsPerPage}`;
}

function controlLoadingIndicatorWithTextOfPlaylistsPerPageDropDown()
{
    const elementId = "playlistsPerPageDropdown";
    controlEnablementOfElementById(elementId);
    replaceElementContentsWithLoadingIndicatorById(elementId, true);
}
