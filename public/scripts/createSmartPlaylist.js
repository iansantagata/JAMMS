"use strict";

// Script Logic
let ruleCounter = 0;

addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);
addOnClickEventListenerToElementById("addLimitButton", addLimitFormFields);
addOnClickEventListenerToElementById("addOrderButton", addOrderFormFields);

addOnClickEventListenerToElementById("generateSmartPlaylistPreviewButton", previewSmartPlaylist);

addOnChangeEventListenerToElementById("createSmartPlaylistForm", displayPreviewOutOfDateAlert);

// DOM Specific Functions
function previewSmartPlaylist()
{
    // First, make sure the event fired correctly and the form is valid
    const eventTargetId = event.target.id;
    const eventElement = document.getElementById(eventTargetId);

    const formElement = getClosestForm(eventElement);
    if (!formElement)
    {
        const formElementNotFoundError = new Error("Failed to find closest related form element");
        console.error(formElementNotFoundError);
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

    const textElement = document.createTextNode("Note - All playlist previews are generated on request. On top of the limits set above, previews are also limited to the first 25 matching tracks found. Any created smart playlist may differ from the tracks shown in the preview.");

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
    const emptyOptionRuleType = document.createElement("option");
    emptyOptionRuleType.setAttribute("value", "");
    emptyOptionRuleType.setAttribute("selected", "");
    emptyOptionRuleType.setAttribute("disabled", "");
    emptyOptionRuleType.setAttribute("hidden", "");
    emptyOptionRuleType.innerText = "Select a Field";

    const acousticnessOptionRuleType = document.createElement("option");
    acousticnessOptionRuleType.setAttribute("value", "acousticness");
    acousticnessOptionRuleType.innerText = "Acousticness";

    const albumOptionRuleType = document.createElement("option");
    albumOptionRuleType.setAttribute("value", "album");
    albumOptionRuleType.innerText = "Album Name";

    const artistOptionRuleType = document.createElement("option");
    artistOptionRuleType.setAttribute("value", "artist");
    artistOptionRuleType.innerText = "Artist Name";

    const danceabilityOptionRuleType = document.createElement("option");
    danceabilityOptionRuleType.setAttribute("value", "danceability");
    danceabilityOptionRuleType.innerText = "Danceability";

    const genreOptionRuleType = document.createElement("option");
    genreOptionRuleType.setAttribute("value", "genre");
    genreOptionRuleType.innerText = "Genre";

    const loudnessOptionRuleType = document.createElement("option");
    loudnessOptionRuleType.setAttribute("value", "loudness");
    loudnessOptionRuleType.innerText = "Loudness";

    const releaseDateOptionRuleType = document.createElement("option");
    releaseDateOptionRuleType.setAttribute("value", "releaseDate");
    releaseDateOptionRuleType.innerText = "Release Date";

    const songDurationOptionRuleType = document.createElement("option");
    songDurationOptionRuleType.setAttribute("value", "duration");
    songDurationOptionRuleType.innerText = "Song Length";

    const songOptionRuleType = document.createElement("option");
    songOptionRuleType.setAttribute("value", "song");
    songOptionRuleType.innerText = "Song Name";

    const tempoOptionRuleType = document.createElement("option");
    tempoOptionRuleType.setAttribute("value", "tempo");
    tempoOptionRuleType.innerText = "Tempo";

    const selectRuleTypeId = `playlistRuleType-${ruleCounter}`;
    const selectRuleType = document.createElement("select");
    selectRuleType.setAttribute("name", selectRuleTypeId);
    selectRuleType.setAttribute("id", selectRuleTypeId);
    selectRuleType.setAttribute("class", "form-control");
    selectRuleType.setAttribute("required", "");
    selectRuleType.appendChild(emptyOptionRuleType);
    selectRuleType.appendChild(acousticnessOptionRuleType);
    selectRuleType.appendChild(albumOptionRuleType);
    selectRuleType.appendChild(artistOptionRuleType);
    selectRuleType.appendChild(danceabilityOptionRuleType);
    selectRuleType.appendChild(genreOptionRuleType);
    selectRuleType.appendChild(loudnessOptionRuleType);
    selectRuleType.appendChild(releaseDateOptionRuleType);
    selectRuleType.appendChild(songDurationOptionRuleType);
    selectRuleType.appendChild(songOptionRuleType);
    selectRuleType.appendChild(tempoOptionRuleType);

    const ruleTypeDiv = document.createElement("div");
    ruleTypeDiv.setAttribute("class", "col-md my-2");
    ruleTypeDiv.appendChild(selectRuleType);

    // Rule Operator Selection
    const emptyOptionRuleOperator = document.createElement("option");
    emptyOptionRuleOperator.setAttribute("value", "");
    emptyOptionRuleOperator.setAttribute("selected", "");
    emptyOptionRuleOperator.setAttribute("disabled", "");
    emptyOptionRuleOperator.setAttribute("hidden", "");
    emptyOptionRuleOperator.innerText = "Select an Operator";

    // The select is disabled to start with only a defualt option
    // It becomes enabled with more options once a data field is selected
    const selectRuleOperatorId = `playlistRuleOperator-${ruleCounter}`;
    const selectRuleOperator = document.createElement("select");
    selectRuleOperator.setAttribute("name", selectRuleOperatorId);
    selectRuleOperator.setAttribute("id", selectRuleOperatorId);
    selectRuleOperator.setAttribute("class", "form-control disabled");
    selectRuleOperator.setAttribute("required", "");
    selectRuleOperator.setAttribute("disabled", "");
    selectRuleOperator.appendChild(emptyOptionRuleOperator);

    const ruleOperatorDiv = document.createElement("div");
    ruleOperatorDiv.setAttribute("class", "col-md my-2");
    ruleOperatorDiv.appendChild(selectRuleOperator);

    // Rule Text Data
    // The data entry input is disabled to start with
    // It becomes enabled with once a data field is selected
    const ruleDataInputId = `playlistRuleData-${ruleCounter}`;
    const ruleDataInput = document.createElement("input");
    ruleDataInput.setAttribute("type", "text");
    ruleDataInput.setAttribute("name", ruleDataInputId);
    ruleDataInput.setAttribute("id", ruleDataInputId);
    ruleDataInput.setAttribute("class", "form-control disabled");
    ruleDataInput.setAttribute("placeholder", "Your Rule Data");
    ruleDataInput.setAttribute("required", "");
    ruleDataInput.setAttribute("disabled", "");

    const ruleUnitDescriptionDiv = document.createElement("div");
    ruleUnitDescriptionDiv.setAttribute("class", "input-group-append");
    ruleUnitDescriptionDiv.setAttribute("id", `playlistRuleUnitContainer-${ruleCounter}`);

    const ruleDataInputGroupDiv = document.createElement("div");
    ruleDataInputGroupDiv.setAttribute("class", "input-group");
    ruleDataInputGroupDiv.appendChild(ruleDataInput);
    ruleDataInputGroupDiv.appendChild(ruleUnitDescriptionDiv);

    const ruleTextDataDiv = document.createElement("div");
    ruleTextDataDiv.setAttribute("class", "col-md my-2");
    ruleTextDataDiv.appendChild(ruleDataInputGroupDiv);

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

    // Add an event listener to the remove rule button that has been added
    addOnClickEventListenerToElement(removeRuleButton, removeRuleFormFields);

    // Add an event listener to the selection of a rule data field to correspond to operators and data
    addOnChangeEventListenerToElement(selectRuleType, enableValidOperatorOptions);
    addOnChangeEventListenerToElement(selectRuleType, enableValidRuleDataEntry);
    addOnChangeEventListenerToElement(selectRuleType, enableDataUnitVisibility);

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
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

    // Add an event listener to the remove limits button that has been added
    addOnClickEventListenerToElement(removeLimitButton, removeLimitsFormFields);

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
}

function enableValidOperatorOptions()
{
    // There are multiple rules, so make sure we get the right one based on the event
    const eventElementId = event.target.id;

    const index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        const ruleNumberNotFoundError = new Error("Failed to find rule number from event ID");
        console.error(ruleNumberNotFoundError.message);
        return;
    }

    const targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        const ruleNotFoundError = new Error("Failed to find rule data");
        console.error(ruleNotFoundError.message);
        return;
    }

    // Get the type of field that was selected
    const ruleFieldValue = event.target.value;
    const ruleFieldType = getDataFieldType(ruleFieldValue);
    if (ruleFieldType === null)
    {
        const typeUnknownError = new Error("Failed to determine rule data type");
        console.error(typeUnknownError.message);
        return;
    }

    // Get the operator element for this rule where a data field was selected
    const ruleOperatorElement = document.getElementById(`playlistRuleOperator-${targetRuleNumber}`);
    if (!ruleOperatorElement)
    {
        const ruleOperatorNotFoundError = new Error("Failed to find rule operator");
        console.error(ruleOperatorNotFoundError.message);
        return;
    }

    // Clear out all the previous child elements for the operator to replace with new ones
    removeChildElements(ruleOperatorElement);

    // Add the new replacement operator options to the select element based on the type
    let ruleOperatorAddSuccess = false;
    switch (ruleFieldType)
    {
        case "string":
            addRuleOperatorOptionsForStringDataType(ruleOperatorElement);
            ruleOperatorAddSuccess = true;
            break;

        case "date":
            addRuleOperatorOptionsForDateDataType(ruleOperatorElement);
            ruleOperatorAddSuccess = true;
            break;

        case "negativeInteger":
        case "positiveInteger":
        case "percentage":
            addRuleOperatorOptionsForNumberDataType(ruleOperatorElement);
            ruleOperatorAddSuccess = true;
            break;

        default:
            ruleOperatorAddSuccess = false;
            break;
    }

    if (!ruleOperatorAddSuccess)
    {
        const ruleOperatorOptionsNotAddedError = new Error("Failed to add rule operator options based on rule data type");
        console.error(ruleOperatorOptionsNotAddedError.message);
        return;
    }

    // Enable the operator if it was disabled or do nothing if it was already enabled
    if (ruleOperatorElement.disabled)
    {
        controlEnablementOfElement(ruleOperatorElement);
    }
}

function enableValidRuleDataEntry()
{
    // There are multiple rules, so make sure we get the right one based on the event
    const eventElementId = event.target.id;

    const index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        const ruleNumberNotFoundError = new Error("Failed to find rule number from event ID");
        console.error(ruleNumberNotFoundError.message);
        return;
    }

    const targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        const ruleNotFoundError = new Error("Failed to find rule data");
        console.error(ruleNotFoundError.message);
        return;
    }

    // Get the type of field that was selected
    const ruleFieldValue = event.target.value;
    const ruleFieldType = getDataFieldType(ruleFieldValue);
    if (ruleFieldType === null)
    {
        const typeUnknownError = new Error("Failed to determine rule data type");
        console.error(typeUnknownError.message);
        return;
    }

    // Get the data element for this rule where a data field was selected
    const ruleDataElement = document.getElementById(`playlistRuleData-${targetRuleNumber}`);
    if (!ruleDataElement)
    {
        const ruleDataElementNotFoundError = new Error("Failed to find rule data element");
        console.error(ruleDataElementNotFoundError.message);
        return;
    }

    // Update the type of the data entry based on what data type is expected and clear out old values
    let isRuleFieldTypeChangeSuccess = false;
    switch (ruleFieldType)
    {
        case "string":
            ruleDataElement.setAttribute("type", "text");
            ruleDataElement.removeAttribute("min");
            ruleDataElement.removeAttribute("max");
            ruleDataElement.value = "";
            isRuleFieldTypeChangeSuccess = true;
            break;

        case "date":
            ruleDataElement.setAttribute("type", "date");
            ruleDataElement.removeAttribute("min");
            ruleDataElement.removeAttribute("max");
            ruleDataElement.value = "";
            isRuleFieldTypeChangeSuccess = true;
            break;


        case "negativeInteger":
            ruleDataElement.setAttribute("type", "number");
            ruleDataElement.setAttribute("min", "-60");
            ruleDataElement.setAttribute("max", "0");
            ruleDataElement.value = "";
            isRuleFieldTypeChangeSuccess = true;
            break;

        case "positiveInteger":
            ruleDataElement.setAttribute("type", "number");
            ruleDataElement.setAttribute("min", "0");
            ruleDataElement.removeAttribute("max");
            ruleDataElement.value = "";
            isRuleFieldTypeChangeSuccess = true;
            break;

        case "percentage":
            ruleDataElement.setAttribute("type", "number");
            ruleDataElement.setAttribute("min", "0");
            ruleDataElement.setAttribute("max", "100");
            ruleDataElement.value = "";
            isRuleFieldTypeChangeSuccess = true;
            break;

        default:
            isRuleFieldTypeChangeSuccess = false;
            break;
    }

    if (!isRuleFieldTypeChangeSuccess)
    {
        const ruleFieldTypeNotChangedError = new Error("Failed to change data entry field type based on rule data type");
        console.error(ruleFieldTypeNotChangedError.message);
        return;
    }

    // Enable the entry field if it was disabled or do nothing if it was already enabled
    if (ruleDataElement.disabled)
    {
        controlEnablementOfElement(ruleDataElement);
    }
}

function enableDataUnitVisibility()
{
    // There are multiple rules, so make sure we get the right one based on the event
    const eventElementId = event.target.id;

    const index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        const ruleNumberNotFoundError = new Error("Failed to find rule number from event ID");
        console.error(ruleNumberNotFoundError.message);
        return;
    }

    const targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        const ruleNotFoundError = new Error("Failed to find rule data");
        console.error(ruleNotFoundError.message);
        return;
    }

    // Make sure we have a container to put unit data into
    const unitContainerElement = document.getElementById(`playlistRuleUnitContainer-${targetRuleNumber}`);
    if (unitContainerElement === null)
    {
        const unitContainerNotFoundError = new Error("Failed to locate container to place unit description");
        console.error(unitContainerNotFoundError);
        return;
    }

    // Clear out the container, we can recreate elements within it if needed
    removeChildElements(unitContainerElement);

    // Get the type of field that was selected
    const ruleFieldValue = event.target.value;
    const ruleFieldUnit = getDataFieldUnit(ruleFieldValue);

    // If we  do not have a unit to show the user intentionally, there is no need to re-create the unit elements, so exit
    if (ruleFieldUnit === null)
    {
        return;
    }

    // Create the unit description and shove it onto the container
    const ruleUnitId = `playlistRuleUnit-${targetRuleNumber}`;
    const ruleUnitDescription = document.createElement("span");
    ruleUnitDescription.setAttribute("class", "input-group-text");
    ruleUnitDescription.setAttribute("id", ruleUnitId);
    ruleUnitDescription.innerText = ruleFieldUnit;

    // We want to send this up with the rules form in case we need to convert units, so make it a hidden field
    const ruleUnitHiddenFormField = document.createElement("input");
    ruleUnitHiddenFormField.setAttribute("type", "hidden");
    ruleUnitHiddenFormField.setAttribute("name", ruleUnitId);
    ruleUnitHiddenFormField.value = getCamelCase(ruleFieldUnit);

    // Put both the hidden element and the description in the container
    unitContainerElement.appendChild(ruleUnitDescription);
    unitContainerElement.appendChild(ruleUnitHiddenFormField);
}

function getDataFieldType(ruleFieldValue)
{
    switch (ruleFieldValue)
    {
        case "album":
        case "artist":
        case "genre":
        case "song":
            return "string";

        case "releaseDate":
            return "date";

        case "loudness":
            return "negativeInteger";

        case "tempo":
        case "duration":
            return "positiveInteger";

        case "acousticness":
        case "danceability":
            return "percentage";

        default:
            return null;
    }
}

function getDataFieldUnit(ruleFieldValue)
{
    switch (ruleFieldValue)
    {
        case "tempo":
            return "Beats Per Minute";

        case "duration":
            return "Minutes";

        case "loudness":
            return "Decibels";

        case "acousticness":
        case "danceability":
            return "Percent";

        case "album":
        case "artist":
        case "genre":
        case "releaseDate":
        case "song":
        default:
            return null;
    }
}

function addRuleOperatorOptionsForStringDataType(ruleOperatorElement)
{
    const emptyOptionRuleOperator = document.createElement("option");
    emptyOptionRuleOperator.setAttribute("value", "");
    emptyOptionRuleOperator.setAttribute("selected", "");
    emptyOptionRuleOperator.setAttribute("disabled", "");
    emptyOptionRuleOperator.setAttribute("hidden", "");
    emptyOptionRuleOperator.innerText = "Select an Operator";

    const equalOptionRuleOperator = document.createElement("option");
    equalOptionRuleOperator.setAttribute("value", "equal");
    equalOptionRuleOperator.innerText = "is";

    const notEqualOptionRuleOperator = document.createElement("option");
    notEqualOptionRuleOperator.setAttribute("value", "notEqual");
    notEqualOptionRuleOperator.innerText = "is not";

    const containsOptionRuleOperator = document.createElement("option");
    containsOptionRuleOperator.setAttribute("value", "contains");
    containsOptionRuleOperator.innerText = "contains";

    const doesNotContainOptionRuleOperator = document.createElement("option");
    doesNotContainOptionRuleOperator.setAttribute("value", "doesNotContain");
    doesNotContainOptionRuleOperator.innerText = "does not contain";

    ruleOperatorElement.appendChild(emptyOptionRuleOperator);
    ruleOperatorElement.appendChild(equalOptionRuleOperator);
    ruleOperatorElement.appendChild(notEqualOptionRuleOperator);
    ruleOperatorElement.appendChild(containsOptionRuleOperator);
    ruleOperatorElement.appendChild(doesNotContainOptionRuleOperator);
}

function addRuleOperatorOptionsForNumberDataType(ruleOperatorElement)
{
    const emptyOptionRuleOperator = document.createElement("option");
    emptyOptionRuleOperator.setAttribute("value", "");
    emptyOptionRuleOperator.setAttribute("selected", "");
    emptyOptionRuleOperator.setAttribute("disabled", "");
    emptyOptionRuleOperator.setAttribute("hidden", "");
    emptyOptionRuleOperator.innerText = "Select an Operator";

    const equalOptionRuleOperator = document.createElement("option");
    equalOptionRuleOperator.setAttribute("value", "equal");
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

    ruleOperatorElement.appendChild(emptyOptionRuleOperator);
    ruleOperatorElement.appendChild(equalOptionRuleOperator);
    ruleOperatorElement.appendChild(notEqualOptionRuleOperator);
    ruleOperatorElement.appendChild(greaterThanOptionRuleOperator);
    ruleOperatorElement.appendChild(greaterThanOrEqualToOptionRuleOperator);
    ruleOperatorElement.appendChild(lessThanOptionRuleOperator);
    ruleOperatorElement.appendChild(lessThanOrEqualToOptionRuleOperator);
}

function addRuleOperatorOptionsForDateDataType(ruleOperatorElement)
{
    const emptyOptionRuleOperator = document.createElement("option");
    emptyOptionRuleOperator.setAttribute("value", "");
    emptyOptionRuleOperator.setAttribute("selected", "");
    emptyOptionRuleOperator.setAttribute("disabled", "");
    emptyOptionRuleOperator.setAttribute("hidden", "");
    emptyOptionRuleOperator.innerText = "Select an Operator";

    const equalOptionRuleOperator = document.createElement("option");
    equalOptionRuleOperator.setAttribute("value", "equal");
    equalOptionRuleOperator.innerText = "is";

    const notEqualOptionRuleOperator = document.createElement("option");
    notEqualOptionRuleOperator.setAttribute("value", "notEqual");
    notEqualOptionRuleOperator.innerText = "is not";

    const greaterThanOptionRuleOperator = document.createElement("option");
    greaterThanOptionRuleOperator.setAttribute("value", "greaterThan");
    greaterThanOptionRuleOperator.innerText = "is after";

    const greaterThanOrEqualToOptionRuleOperator = document.createElement("option");
    greaterThanOrEqualToOptionRuleOperator.setAttribute("value", "greaterThanOrEqual");
    greaterThanOrEqualToOptionRuleOperator.innerText = "is on or after";

    const lessThanOptionRuleOperator = document.createElement("option");
    lessThanOptionRuleOperator.setAttribute("value", "lessThan");
    lessThanOptionRuleOperator.innerText = "is before";

    const lessThanOrEqualToOptionRuleOperator = document.createElement("option");
    lessThanOrEqualToOptionRuleOperator.setAttribute("value", "lessThanOrEqual");
    lessThanOrEqualToOptionRuleOperator.innerText = "is on or before";

    ruleOperatorElement.appendChild(emptyOptionRuleOperator);
    ruleOperatorElement.appendChild(equalOptionRuleOperator);
    ruleOperatorElement.appendChild(notEqualOptionRuleOperator);
    ruleOperatorElement.appendChild(greaterThanOptionRuleOperator);
    ruleOperatorElement.appendChild(greaterThanOrEqualToOptionRuleOperator);
    ruleOperatorElement.appendChild(lessThanOptionRuleOperator);
    ruleOperatorElement.appendChild(lessThanOrEqualToOptionRuleOperator);
}

function addOrderFormFields()
{
    // Create pieces of the form row needed for ordering the playlist
    // Playlist Order Field Options
    const orderFieldAlbumOptionElement = document.createElement("option");
    orderFieldAlbumOptionElement.setAttribute("value", "album");
    orderFieldAlbumOptionElement.innerText = "Album Name";

    const orderFieldArtistOptionElement = document.createElement("option");
    orderFieldArtistOptionElement.setAttribute("value", "artist");
    orderFieldArtistOptionElement.setAttribute("selected", "");
    orderFieldArtistOptionElement.innerText = "Artist Name";

    const orderFieldLibraryAddDateOptionElement = document.createElement("option");
    orderFieldLibraryAddDateOptionElement.setAttribute("value", "libraryAddDate");
    orderFieldLibraryAddDateOptionElement.innerText = "Library Add Date";

    const orderFieldReleaseDateOptionElement = document.createElement("option");
    orderFieldReleaseDateOptionElement.setAttribute("value", "releaseDate");
    orderFieldReleaseDateOptionElement.innerText = "Release Date";

    const orderFieldDurationOptionElement = document.createElement("option");
    orderFieldDurationOptionElement.setAttribute("value", "duration");
    orderFieldDurationOptionElement.innerText = "Song Length";

    const orderFieldSongOptionElement = document.createElement("option");
    orderFieldSongOptionElement.setAttribute("value", "song");
    orderFieldSongOptionElement.innerText = "Song Name";

    const orderFieldPopularityOptionElement = document.createElement("option");
    orderFieldPopularityOptionElement.setAttribute("value", "popularity");
    orderFieldPopularityOptionElement.innerText = "Song Popularity";

    // Playlist Order Field Select
    const orderFieldSelectElement = document.createElement("select");
    orderFieldSelectElement.setAttribute("name", "playlistOrderField");
    orderFieldSelectElement.setAttribute("class", "form-control");
    orderFieldSelectElement.setAttribute("id", "playlistOrderFieldInput");
    orderFieldSelectElement.setAttribute("required", "");

    orderFieldSelectElement.appendChild(orderFieldAlbumOptionElement);
    orderFieldSelectElement.appendChild(orderFieldArtistOptionElement);
    orderFieldSelectElement.appendChild(orderFieldLibraryAddDateOptionElement);
    orderFieldSelectElement.appendChild(orderFieldReleaseDateOptionElement);
    orderFieldSelectElement.appendChild(orderFieldDurationOptionElement);
    orderFieldSelectElement.appendChild(orderFieldSongOptionElement);
    orderFieldSelectElement.appendChild(orderFieldPopularityOptionElement);

    // Playlist Order Type Div
    const orderFieldDivElement = document.createElement("div");
    orderFieldDivElement.setAttribute("class", "col-md my-2");
    orderFieldDivElement.appendChild(orderFieldSelectElement);

    // Playlist Order Direction Options
    const orderDirectionAscendingOptionElement = document.createElement("option");
    orderDirectionAscendingOptionElement.setAttribute("value", "ascending");
    orderDirectionAscendingOptionElement.setAttribute("selected", "");
    orderDirectionAscendingOptionElement.innerText = "Ascending Order";

    const orderDirectionDescendingOptionElement = document.createElement("option");
    orderDirectionDescendingOptionElement.setAttribute("value", "descending");
    orderDirectionDescendingOptionElement.innerText = "Descending Order";

    // Playlist Order Direction Select
    const orderDirectionSelectElement = document.createElement("select");
    orderDirectionSelectElement.setAttribute("name", "playlistOrderDirection");
    orderDirectionSelectElement.setAttribute("class", "form-control");
    orderDirectionSelectElement.setAttribute("id", "playlistOrderDirectionInput");
    orderDirectionSelectElement.setAttribute("required", "");

    orderDirectionSelectElement.appendChild(orderDirectionAscendingOptionElement);
    orderDirectionSelectElement.appendChild(orderDirectionDescendingOptionElement);

    // Playlist Order Direction Div
    const orderDirectionDivElement = document.createElement("div");
    orderDirectionDivElement.setAttribute("class", "col-md my-2");
    orderDirectionDivElement.appendChild(orderDirectionSelectElement);

    // Order Inputs in Row
    const rowDiv = document.createElement("div");
    rowDiv.setAttribute("class", "form-row my-2");
    rowDiv.appendChild(orderFieldDivElement);
    rowDiv.appendChild(orderDirectionDivElement);

    // Add all the components to the top level order div
    const orderDiv = document.createElement("div");
    orderDiv.setAttribute("class", "my-2");
    orderDiv.setAttribute("id", "orderData");
    orderDiv.appendChild(rowDiv);

    // Append a form row of fields for order
    const orderContainerElement = document.getElementById("orderContainer");
    orderContainerElement.appendChild(orderDiv);

    // Playlist Order Removal
    const removeOrderButton = document.createElement("button");
    removeOrderButton.setAttribute("type", "button");
    removeOrderButton.setAttribute("name", "removeOrderButton");
    removeOrderButton.setAttribute("id", "removeOrderButton");
    removeOrderButton.setAttribute("class", "btn btn-outline-danger btn-sm my-3");
    removeOrderButton.innerText = "Remove Order";

    // Remove the add order button and replace with a removal button
    // This is because we only want to support one ordering at a time
    const orderButtonContainer = document.getElementById("orderButtonContainer");
    removeChildElements(orderButtonContainer);
    orderButtonContainer.appendChild(removeOrderButton);

    // Add an event listener to the remove limits button that has been added
    addOnClickEventListenerToElement(removeOrderButton, removeOrderFormFields);

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
}

function removeRuleFormFields()
{
    // There may be multiple buttons for removal, see which one this is by ID
    const eventElementId = event.target.id;
    const index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        const ruleNumberNotFoundError = new Error("Failed to find rule number from event ID");
        console.error(ruleNumberNotFoundError.message);
        return;
    }

    const targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        const ruleNotFoundError = new Error("Failed to find rule data");
        console.error(ruleNotFoundError.message);
        return;
    }

    // With the rule number, delete the entire rule from the DOM
    // This deletes multiple child nodes, including the event target node
    const targetRuleId = `rule-${targetRuleNumber}`;
    const targetRuleElement = document.getElementById(targetRuleId);
    targetRuleElement.remove();

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
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

    // Add back an event listener to the add limit button
    addOnClickEventListenerToElementById("addLimitButton", addLimitFormFields);

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
}

function removeOrderFormFields()
{
    // Remove the order data
    const orderDataElement = document.getElementById("orderData");
    orderDataElement.remove();

    // Remove the remove order button and replace with an add order button
    // This is because we only want to support one ordering at a time
    const orderButtonContainer = document.getElementById("orderButtonContainer");
    removeChildElements(orderButtonContainer);

    // Playlist Limit Addition
    const addOrderButton = document.createElement("button");
    addOrderButton.setAttribute("type", "button");
    addOrderButton.setAttribute("name", "addOrderButton");
    addOrderButton.setAttribute("id", "addOrderButton");
    addOrderButton.setAttribute("class", "btn btn-outline-info btn-sm my-3");
    addOrderButton.innerText = "Add Order";

    // Restore the button to its original location
    orderButtonContainer.appendChild(addOrderButton);

    // Add back an event listener to the add order button
    addOnClickEventListenerToElementById("addOrderButton", addOrderFormFields);

    // Finally, trigger a "changed" warning if a preview was already generated
    displayPreviewOutOfDateAlert();
}
