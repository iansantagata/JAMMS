"use strict";

// Script Logic
let ruleCounter = 0;

addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);
addOnClickEventListenerToElementById("addLimitButton", addLimitFormFields);

addOnClickEventListenerToElementById("generateSmartPlaylistPreviewButton", previewSmartPlaylist);

addOnChangeEventListenerToElementById("createSmartPlaylistForm", displayPreviewOutOfDateAlert);

// DOM Specific Functions
function controlEnablementOfOrderElements()
{
    controlEnablementOfElementById("playlistOrderDirectionInput");
    controlEnablementOfElementById("playlistOrderFieldInput");
}

function previewSmartPlaylist()
{
    // First, make sure the event fired correctly and the form is valid
    const eventTargetId = event.target.id;
    const eventElement = document.getElementById(eventTargetId);

    const formElement = getClosestForm(eventElement);
    if (!formElement)
    {
        return;
    }

    const isValidForm = isFormValid(formElement);
    if (!isValidForm)
    {
        return;
    }

    // Next, trigger the loading icon for the button
    controlEnablementOfElement(eventElement);
    replaceElementContentsWithLoadingIndicator(eventElement, true);

    // In case there was a previous error in place, remove it so the user does not get confused
    const errorContainerElement = document.getElementById("previewErrorMessage");
    if (errorContainerElement)
    {
        errorContainerElement.remove();
    }

    // In case there was a previous preview in place, remove it so the user does not get confused
    const previewContainerElement = document.getElementById("previewContainer");
    if (previewContainerElement)
    {
        previewContainerElement.remove();
    }

    // Grab the form data and pump it into a JSON object
    const formData = new FormData(formElement);
    const plainFormData = Object.fromEntries(formData.entries());
    const formDataJson = JSON.stringify(plainFormData);

    const fetchOptions = {
        body: formDataJson,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        method: "POST"
    };

    // Make the AJAX call and handle the response by displaying the preview data
    fetch("/getSmartPlaylistPreview", fetchOptions)
        .then(response => response.json())
        .then(displaySmartPlaylistPreview)
        .catch(handlePlaylistPreviewError)
        .finally(restoreGeneratePreviewButton);
}

function handlePlaylistPreviewError(error)
{
    // Create an alert telling the user there is a problem
    const textElement = document.createTextNode("Error - Unable to find any tracks to preview with the submitted rules and settings.");

    const alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-x-circle-fill mx-2");

    const alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewErrorMessage");
    alertDivElement.setAttribute("class", "alert alert-danger my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Finally, append all of this new content onto the end of the existing form
    const formElement = document.getElementById("createSmartPlaylistForm");
    formElement.appendChild(alertDivElement);

    // Log error to the console for developer visibility, even though it is handled in the UI
    console.error(error.message);
}

function displaySmartPlaylistPreview(data)
{
    if (!data)
    {
        const dataNotFoundError = new Error("Failed to find AJAX response data");
        handlePlaylistPreviewError(dataNotFoundError);
        return;
    }

    if (!Array.isArray(data) || data.length <= 0)
    {
        const tracksNotFoundError = new Error("Failed to find tracks in AJAX response data");
        handlePlaylistPreviewError(tracksNotFoundError);
        return;
    }

    // Extract the saved tracks from the response data, removing garbage data if there is any
    const tracks = data
        .map(item => item?.track ?? null)
        .filter(mappedItem => mappedItem !== null);

    if (!Array.isArray(tracks) || tracks.length <= 0)
    {
        const validTracksNotFoundError = new Error("Failed to find valid tracks information in AJAX response data");
        handlePlaylistPreviewError(validTracksNotFoundError);
        return;
    }

    // Start with a header to indicate that this is the preview tracks section
    const headerElement = document.createElement("h4");
    headerElement.setAttribute("class", "my-3");
    headerElement.innerText = "Smart Playlist Track Preview";

    const textElement = document.createTextNode("Note - All playlist previews are generated on request. On top of the limits set above, previews are also limitied to the first 25 matching tracks found. Any created smart playlist may differ from the tracks shown in the preview.");

    const alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-info-circle-fill mx-2");

    const alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewInfoMessage");
    alertDivElement.setAttribute("class", "alert alert-info my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Next, create the playlist preview table, beginning with the header cells
    const tableHeaderColumnOneElement = document.createElement("th");
    tableHeaderColumnOneElement.setAttribute("scope", "col");
    tableHeaderColumnOneElement.setAttribute("class", "align-middle");
    tableHeaderColumnOneElement.innerText = "Track #";

    const tableHeaderColumnTwoElement = document.createElement("th");
    tableHeaderColumnTwoElement.setAttribute("scope", "col");
    tableHeaderColumnTwoElement.setAttribute("class", "align-middle");
    tableHeaderColumnTwoElement.innerText = "Title";

    const tableHeaderColumnThreeElement = document.createElement("th");
    tableHeaderColumnThreeElement.setAttribute("scope", "col");
    tableHeaderColumnThreeElement.setAttribute("class", "align-middle");
    tableHeaderColumnThreeElement.innerText = "Artist";

    const tableHeaderColumnFourElement = document.createElement("th");
    tableHeaderColumnFourElement.setAttribute("scope", "col");
    tableHeaderColumnFourElement.setAttribute("class", "align-middle");
    tableHeaderColumnFourElement.innerText = "Album";

    const tableHeaderColumnFiveElement = document.createElement("th");
    tableHeaderColumnFiveElement.setAttribute("scope", "col");
    tableHeaderColumnFiveElement.setAttribute("class", "align-middle");
    tableHeaderColumnFiveElement.innerText = "Album Art";

    // Combine all the header cells into the header row
    const tableHeadRowElement = document.createElement("tr");
    tableHeadRowElement.appendChild(tableHeaderColumnOneElement);
    tableHeadRowElement.appendChild(tableHeaderColumnTwoElement);
    tableHeadRowElement.appendChild(tableHeaderColumnThreeElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFourElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFiveElement);

    const tableHeadElement = document.createElement("thead");
    tableHeadElement.appendChild(tableHeadRowElement);

    // For the table body, we want one row in the preview table per track
    let trackNumber = 0;
    const tableBodyElement = document.createElement("tbody");

    for (const track of tracks)
    {
        // Track Number
        trackNumber++;
        const tableBodyHeaderCellElement = document.createElement("th");
        tableBodyHeaderCellElement.setAttribute("scope", "row");
        tableBodyHeaderCellElement.setAttribute("class", "align-middle");
        tableBodyHeaderCellElement.innerText = trackNumber;

        // Track Name
        const tableBodyFirstDataElement = document.createElement("td");
        tableBodyFirstDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyFirstDataElement.innerText = track.name;

        // Artist Name(s)
        const tableBodySecondDataElement = document.createElement("td");
        tableBodySecondDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodySecondDataElement.innerText = getCommaSeparatedArtistNames(track.artists);

        // Album Name
        track.album = track.album ?? {};
        const tableBodyThirdDataElement = document.createElement("td");
        tableBodyThirdDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyThirdDataElement.innerText = track.album.name;

        // Album Art
        const defaultImagePath = "/images/question.png";
        const minimumPixelsPerSide = 64;
        const albumArtPath = getImagePath(track.album.images, minimumPixelsPerSide, defaultImagePath);

        const albumArtImageElement = document.createElement("img");
        albumArtImageElement.setAttribute("class", "img-fluid");
        albumArtImageElement.setAttribute("alt", `Album Named ${track.album.name}`);
        albumArtImageElement.setAttribute("src", albumArtPath);

        const tableBodyFourthDataElement = document.createElement("td");
        tableBodyFourthDataElement.setAttribute("class", "align-middle col-md-2");
        tableBodyFourthDataElement.appendChild(albumArtImageElement);

        // Combine all the cells together into the table row
        const tableBodyRowElement = document.createElement("tr");
        tableBodyRowElement.appendChild(tableBodyHeaderCellElement);
        tableBodyRowElement.appendChild(tableBodyFirstDataElement);
        tableBodyRowElement.appendChild(tableBodySecondDataElement);
        tableBodyRowElement.appendChild(tableBodyThirdDataElement);
        tableBodyRowElement.appendChild(tableBodyFourthDataElement);

        // Put the table row into the table
        tableBodyElement.appendChild(tableBodyRowElement);
    }

    // Create the table element where the data will reside
    const tableElement = document.createElement("table");
    tableElement.setAttribute("class", "table table-striped table-sm table-hover");
    tableElement.appendChild(tableHeadElement);
    tableElement.appendChild(tableBodyElement);

    // Add a submit button at the end of the preview so that the user can create their smart playlist after checking the preview
    const buttonElement = document.createElement("button");
    buttonElement.setAttribute("id", "createSmartPlaylistButton");
    buttonElement.setAttribute("type", "submit");
    buttonElement.setAttribute("class", "btn btn-info");
    buttonElement.innerText = "Create Smart Playlist";

    // Add an event listener to the smart playlist button
    addOnClickEventListenerToElement(buttonElement, controlLoadingOfFormSubmitAction);

    const buttonDivElement = document.createElement("div");
    buttonDivElement.setAttribute("class", "my-3");
    buttonDivElement.appendChild(buttonElement);

    // Mark the table as responsive and shove the data inside of it
    const previewContainerElement = document.createElement("div");
    previewContainerElement.setAttribute("id", "previewContainer");
    previewContainerElement.setAttribute("class", "table-responsive");
    previewContainerElement.appendChild(headerElement);
    previewContainerElement.appendChild(alertDivElement);
    previewContainerElement.appendChild(tableElement);
    previewContainerElement.appendChild(buttonDivElement);

    // Finally, append all of this new content onto the end of the existing form
    const formElement = document.getElementById("createSmartPlaylistForm");
    formElement.appendChild(previewContainerElement);
}

function restoreGeneratePreviewButton()
{
    // Flip the enablement of the button and restore its text contents
    const eventElement = document.getElementById("generateSmartPlaylistPreviewButton");
    controlEnablementOfElement(eventElement);
    replaceElementContentsWithText(eventElement, "Preview Smart Playlist Tracks");
}

function displayPreviewOutOfDateAlert()
{
    // First, check that there is a playlist preview already generated
    const previewContainerElement = document.getElementById("previewContainer");
    if (!previewContainerElement)
    {
        return;
    }

    // If there is a playlist preview, and the form has been changed, check for an existing warning
    const previewAlertElement = document.getElementById("previewAlertMessage");
    if (previewAlertElement)
    {
        // Warning already exists, so do not need to do anything
        return;
    }

    // Warning does not exist, so we should create it
    const textElement = document.createTextNode("Warning - Smart playlist rules or settings have changed since this preview was generated.  This preview does not reflect the latest rules and settings.");

    const alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-exclamation-triangle-fill mx-2");

    const alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewAlertMessage");
    alertDivElement.setAttribute("class", "alert alert-warning my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Now shove that alert at the top of the preview
    // Put the alert here so its easily visible and will be removed when a new preview is generated
    const infoMessageElement = document.getElementById("previewInfoMessage");
    previewContainerElement.insertBefore(alertDivElement, infoMessageElement);
}

function addRuleFormFields()
{
    ruleCounter++;

    // Create pieces of the form row needed for the new rule
    // Rule Type Selection
    const albumOptionRuleType = document.createElement("option");
    albumOptionRuleType.setAttribute("value", "album");
    albumOptionRuleType.innerText = "Album Name";

    const artistOptionRuleType = document.createElement("option");
    artistOptionRuleType.setAttribute("value", "artist");
    artistOptionRuleType.setAttribute("selected", "");
    artistOptionRuleType.innerText = "Artist Name";

    const genreOptionRuleType = document.createElement("option");
    genreOptionRuleType.setAttribute("value", "genre");
    genreOptionRuleType.innerText = "Genre";

    const yearOptionRuleType = document.createElement("option");
    yearOptionRuleType.setAttribute("value", "year");
    yearOptionRuleType.innerText = "Release Year";

    const songOptionRuleType = document.createElement("option");
    songOptionRuleType.setAttribute("value", "song");
    songOptionRuleType.innerText = "Song Name";

    const selectRuleType = document.createElement("select");
    selectRuleType.setAttribute("name", `playlistRuleType-${ruleCounter}`);
    selectRuleType.setAttribute("class", "form-control");
    selectRuleType.setAttribute("required", "");
    selectRuleType.appendChild(albumOptionRuleType);
    selectRuleType.appendChild(artistOptionRuleType);
    selectRuleType.appendChild(genreOptionRuleType);
    selectRuleType.appendChild(yearOptionRuleType);
    selectRuleType.appendChild(songOptionRuleType);

    const ruleTypeDiv = document.createElement("div");
    ruleTypeDiv.setAttribute("class", "col-md my-2");
    ruleTypeDiv.appendChild(selectRuleType);

    // Rule Operator Selection
    const equalOptionRuleOperator = document.createElement("option");
    equalOptionRuleOperator.setAttribute("value", "equal");
    equalOptionRuleOperator.setAttribute("selected", "");
    equalOptionRuleOperator.innerText = "is";

    const notEqualOptionRuleOperator = document.createElement("option");
    notEqualOptionRuleOperator.setAttribute("value", "notEqual");
    notEqualOptionRuleOperator.innerText = "is not";

    const greaterThanOptionRuleOperator = document.createElement("option");
    greaterThanOptionRuleOperator.setAttribute("value", "greaterThan");
    greaterThanOptionRuleOperator.innerText = "is greater than";

    const greaterThanOrEqualToOptionRuleOperator = document.createElement("option");
    greaterThanOrEqualToOptionRuleOperator.setAttribute("value", "greaterThanOrEqual");
    greaterThanOrEqualToOptionRuleOperator.innerText = "is greater than or equal to";

    const lessThanOptionRuleOperator = document.createElement("option");
    lessThanOptionRuleOperator.setAttribute("value", "lessThan");
    lessThanOptionRuleOperator.innerText = "is less than";

    const lessThanOrEqualToOptionRuleOperator = document.createElement("option");
    lessThanOrEqualToOptionRuleOperator.setAttribute("value", "lessThanOrEqual");
    lessThanOrEqualToOptionRuleOperator.innerText = "is less than or equal to";

    const containsOptionRuleOperator = document.createElement("option");
    containsOptionRuleOperator.setAttribute("value", "contains");
    containsOptionRuleOperator.innerText = "contains";

    const doesNotContainOptionRuleOperator = document.createElement("option");
    doesNotContainOptionRuleOperator.setAttribute("value", "doesNotContain");
    doesNotContainOptionRuleOperator.innerText = "does not contain";

    const selectRuleOperator = document.createElement("select");
    selectRuleOperator.setAttribute("name", `playlistRuleOperator-${ruleCounter}`);
    selectRuleOperator.setAttribute("class", "form-control");
    selectRuleOperator.setAttribute("required", "");
    selectRuleOperator.appendChild(equalOptionRuleOperator);
    selectRuleOperator.appendChild(notEqualOptionRuleOperator);
    selectRuleOperator.appendChild(greaterThanOptionRuleOperator);
    selectRuleOperator.appendChild(greaterThanOrEqualToOptionRuleOperator);
    selectRuleOperator.appendChild(lessThanOptionRuleOperator);
    selectRuleOperator.appendChild(lessThanOrEqualToOptionRuleOperator);
    selectRuleOperator.appendChild(containsOptionRuleOperator);
    selectRuleOperator.appendChild(doesNotContainOptionRuleOperator);

    const ruleOperatorDiv = document.createElement("div");
    ruleOperatorDiv.setAttribute("class", "col-md my-2");
    ruleOperatorDiv.appendChild(selectRuleOperator);

    // Rule Text Data
    const inputRuleTextData = document.createElement("input");
    inputRuleTextData.setAttribute("type", "text");
    inputRuleTextData.setAttribute("name", `playlistRuleData-${ruleCounter}`);
    inputRuleTextData.setAttribute("class", "form-control");
    inputRuleTextData.setAttribute("placeholder", "Your Rule Data");
    inputRuleTextData.setAttribute("required", "");

    const ruleTextDataDiv = document.createElement("div");
    ruleTextDataDiv.setAttribute("class", "col-md my-2");
    ruleTextDataDiv.appendChild(inputRuleTextData);

    // Remove Rule Button
    const removeRuleButton = document.createElement("button");
    removeRuleButton.setAttribute("type", "button");
    removeRuleButton.setAttribute("name", "removeRuleButton");
    removeRuleButton.setAttribute("id", `removeRuleButton-${ruleCounter}`);
    removeRuleButton.setAttribute("class", "btn btn-outline-danger btn-sm my-2");
    removeRuleButton.innerText = "Remove Rule";

    // Rule Inputs in Row
    const rowDiv = document.createElement("div");
    rowDiv.setAttribute("class", "form-row my-2");
    rowDiv.appendChild(ruleTypeDiv);
    rowDiv.appendChild(ruleOperatorDiv);
    rowDiv.appendChild(ruleTextDataDiv);

    // Add all the components to the top level rule div
    const ruleDiv = document.createElement("div");
    ruleDiv.setAttribute("class", "my-2");
    ruleDiv.setAttribute("id", `rule-${ruleCounter}`);
    ruleDiv.appendChild(rowDiv);
    ruleDiv.appendChild(removeRuleButton);

    // Append a form row of fields for a new rule
    const rulesContainerElement = document.getElementById("rulesContainer");
    rulesContainerElement.appendChild(ruleDiv);

    // Finally, add an event listener to the remove rule button that has been added
    addOnClickEventListenerToElement(removeRuleButton, removeRuleFormFields);
}

function addLimitFormFields()
{
    // Create pieces of the form row needed for limiting the playlist
    // Playlist Limit Value Input
    const limitValueInputElement = document.createElement("input");
    limitValueInputElement.setAttribute("type", "number");
    limitValueInputElement.setAttribute("name", "playlistLimitValue");
    limitValueInputElement.setAttribute("class", "form-control");
    limitValueInputElement.setAttribute("id", "playlistLimitValueInput");
    limitValueInputElement.setAttribute("min", "1");
    limitValueInputElement.setAttribute("max", "10000");
    limitValueInputElement.setAttribute("placeholder", "Your Limit Number");
    limitValueInputElement.setAttribute("required", "");

    const limitValueDivElement = document.createElement("div");
    limitValueDivElement.setAttribute("class", "col-md my-2");
    limitValueDivElement.appendChild(limitValueInputElement);

    // Playlist Limit Type Options
    const limitTypeHoursOptionElement = document.createElement("option");
    limitTypeHoursOptionElement.setAttribute("value", "hours");
    limitTypeHoursOptionElement.innerText = "Hours";

    const limitTypeMinutesOptionElement = document.createElement("option");
    limitTypeMinutesOptionElement.setAttribute("value", "minutes");
    limitTypeMinutesOptionElement.innerText = "Minutes";

    const limitTypeSongsOptionElement = document.createElement("option");
    limitTypeSongsOptionElement.setAttribute("value", "songs");
    limitTypeSongsOptionElement.setAttribute("selected", "");
    limitTypeSongsOptionElement.innerText = "Songs";

    // Playlist Limit Type Select
    const limitTypeSelectElement = document.createElement("select");
    limitTypeSelectElement.setAttribute("name", "playlistLimitType");
    limitTypeSelectElement.setAttribute("class", "form-control");
    limitTypeSelectElement.setAttribute("id", "playlistLimitTypeInput");
    limitTypeSelectElement.setAttribute("required", "");
    limitTypeSelectElement.appendChild(limitTypeHoursOptionElement);
    limitTypeSelectElement.appendChild(limitTypeMinutesOptionElement);
    limitTypeSelectElement.appendChild(limitTypeSongsOptionElement);

    const limitTypeDivElement = document.createElement("div");
    limitTypeDivElement.setAttribute("class", "col-md my-2");
    limitTypeDivElement.appendChild(limitTypeSelectElement);

    // Limit Inputs in Row
    const rowDiv = document.createElement("div");
    rowDiv.setAttribute("class", "form-row my-2");
    rowDiv.appendChild(limitValueDivElement);
    rowDiv.appendChild(limitTypeDivElement);

    // Add all the components to the top level limit div
    const limitDiv = document.createElement("div");
    limitDiv.setAttribute("class", "my-2");
    limitDiv.setAttribute("id", "limitData");
    limitDiv.appendChild(rowDiv);

    // Append a form row of fields for limits
    const limitContainerElement = document.getElementById("limitsContainer");
    limitContainerElement.appendChild(limitDiv);

    // Playlist Limit Removal
    const removeLimitButton = document.createElement("button");
    removeLimitButton.setAttribute("type", "button");
    removeLimitButton.setAttribute("name", "removeLimitButton");
    removeLimitButton.setAttribute("id", "removeLimitButton");
    removeLimitButton.setAttribute("class", "btn btn-outline-danger btn-sm my-3");
    removeLimitButton.innerText = "Remove Limit";

    // Remove the add limit button and replace with a removal button
    // This is because we only want to support one limit at a time
    const limitsButtonContainer = document.getElementById("limitsButtonContainer");
    removeChildElements(limitsButtonContainer);
    limitsButtonContainer.appendChild(removeLimitButton);

    // Finally, add an event listener to the remove limits button that has been added
    addOnClickEventListenerToElement(removeLimitButton, removeLimitsFormFields);
}

function removeRuleFormFields()
{
    // There may be multiple buttons for removal, see which one this is by ID
    const eventElementId = event.target.id;
    const index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        return;
    }

    const targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        return;
    }

    // With the rule number, delete the entire rule from the DOM
    // This deletes multiple child nodes, including the event target node
    const targetRuleId = `rule-${targetRuleNumber}`;
    const targetRuleElement = document.getElementById(targetRuleId);
    targetRuleElement.remove();
}

function removeLimitsFormFields()
{
    // Remove the limit data
    const limitDataElement = document.getElementById("limitData");
    limitDataElement.remove();

    // Remove the remove limit button and replace with an add limit button
    // This is because we only want to support one limit at a time
    const limitsButtonContainer = document.getElementById("limitsButtonContainer");
    removeChildElements(limitsButtonContainer);

    // Playlist Limit Addition
    const addLimitButton = document.createElement("button");
    addLimitButton.setAttribute("type", "button");
    addLimitButton.setAttribute("name", "addLimitButton");
    addLimitButton.setAttribute("id", "addLimitButton");
    addLimitButton.setAttribute("class", "btn btn-outline-info btn-sm my-3");
    addLimitButton.innerText = "Add Limit";

    // Restore the button to its original location
    limitsButtonContainer.appendChild(addLimitButton);

    // Finally, add back an event listener to the add limit button
    addOnClickEventListenerToElementById("addLimitButton", addLimitFormFields);
}
