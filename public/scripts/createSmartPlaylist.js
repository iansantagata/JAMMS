// Script Logic
var lastActiveRuleIndex = 0;

addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("removeRuleButton-" + lastActiveRuleIndex, removeRuleFormFields);
addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);

addOnClickEventListenerToElementById("generateSmartPlaylistPreviewButton", previewSmartPlaylist);

addOnChangeEventListenerToElementById("createSmartPlaylistForm", displayPreviewOutOfDateAlert);

// DOM Specific Functions
function controlEnablementOfLimitElements()
{
    controlEnablementOfElementById("playlistLimitValueInput");
    controlEnablementOfElementById("playlistLimitTypeInput");
}

function controlEnablementOfOrderElements()
{
    controlEnablementOfElementById("playlistOrderDirectionInput");
    controlEnablementOfElementById("playlistOrderFieldInput");
}

function previewSmartPlaylist()
{
    // First, make sure the event fired correctly and the form is valid
    var eventTargetId = event.target.id;
    var eventElement = document.getElementById(eventTargetId);

    var formElement = getClosestForm(eventElement);
    if (formElement === null)
    {
        return;
    }

    var isValidForm = isFormValid(formElement);
    if (!isValidForm)
    {
        return;
    }

    // Next, trigger the loading icon for the button
    controlEnablementOfElement(eventElement);
    replaceElementContentsWithLoadingIndicator(eventElement, true);

    // In case there was a previous error in place, remove it so the user does not get confused
    var errorContainerElement = document.getElementById("previewErrorMessage");
    if (errorContainerElement !== undefined && errorContainerElement !== null)
    {
        errorContainerElement.remove();
    }

    // In case there was a previous preview in place, remove it so the user does not get confused
    var previewContainerElement = document.getElementById("previewContainer");
    if (previewContainerElement !== undefined && previewContainerElement !== null)
    {
        previewContainerElement.remove();
    }

    // Grab the form data and pump it into a JSON object
    var formData = new FormData(formElement);
    var plainFormData = Object.fromEntries(formData.entries());
    var formDataJson = JSON.stringify(plainFormData);

    var fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: formDataJson
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
    var textElement = document.createTextNode("Error - Unable to find any tracks to preview with the submitted rules and settings.");

    var alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-x-circle-fill mx-2");

    var alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewErrorMessage");
    alertDivElement.setAttribute("class", "alert alert-danger my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Finally, append all of this new content onto the end of the existing form
    var formElement = document.getElementById("createSmartPlaylistForm");
    formElement.appendChild(alertDivElement);

    // Log error to the console for developer visibility, even though it is handled in the UI
    console.error(error.message);
}

function displaySmartPlaylistPreview(data)
{
    // TODO - Might be a good idea to throw the preview into a modal of its own instead of on the same page
    // TODO - That does come with some pros and cons however (editing rules in place, regenerating previews, etc)
    if (data === undefined || data === null)
    {
        var dataNotFoundError = new Error("Failed to find AJAX response data");
        handlePlaylistPreviewError(dataNotFoundError);
        return;
    }

    if (data.length === undefined || data.length <= 0)
    {
        var tracksNotFoundError = new Error("Failed to find tracks in AJAX response data");
        handlePlaylistPreviewError(tracksNotFoundError);
        return;
    }

    // Extract the saved tracks from the response data, removing garbage data if there is any
    var tracks = data
        .map(item => item?.track ?? null)
        .filter(mappedItem => mappedItem !== null);

    if (tracks === undefined || tracks === null || tracks.length <= 0)
    {
        var validTracksNotFoundError = new Error("Failed to find valid tracks information in AJAX response data");
        handlePlaylistPreviewError(validTracksNotFoundError);
        return;
    }

    // Start with a header to indicate that this is the preview tracks section
    var headerElement = document.createElement("h4");
    headerElement.setAttribute("class", "my-3");
    headerElement.innerText = "Smart Playlist Track Preview";

    var textElement = document.createTextNode("Note - All playlist previews are generated on request and limited to the first 25 matching tracks.  Any created smart playlist may differ from the tracks shown in the preview.");

    var alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-info-circle-fill mx-2");

    var alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewInfoMessage");
    alertDivElement.setAttribute("class", "alert alert-info my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Next, create the playlist preview table, beginning with the header cells
    var tableHeaderColumnOneElement = document.createElement("th");
    tableHeaderColumnOneElement.setAttribute("scope", "col");
    tableHeaderColumnOneElement.setAttribute("class", "align-middle");
    tableHeaderColumnOneElement.innerText = "Track #";

    var tableHeaderColumnTwoElement = document.createElement("th");
    tableHeaderColumnTwoElement.setAttribute("scope", "col");
    tableHeaderColumnTwoElement.setAttribute("class", "align-middle");
    tableHeaderColumnTwoElement.innerText = "Title";

    var tableHeaderColumnThreeElement = document.createElement("th");
    tableHeaderColumnThreeElement.setAttribute("scope", "col");
    tableHeaderColumnThreeElement.setAttribute("class", "align-middle");
    tableHeaderColumnThreeElement.innerText = "Artist";

    var tableHeaderColumnFourElement = document.createElement("th");
    tableHeaderColumnFourElement.setAttribute("scope", "col");
    tableHeaderColumnFourElement.setAttribute("class", "align-middle");
    tableHeaderColumnFourElement.innerText = "Album";

    var tableHeaderColumnFiveElement = document.createElement("th");
    tableHeaderColumnFiveElement.setAttribute("scope", "col");
    tableHeaderColumnFiveElement.setAttribute("class", "align-middle");
    tableHeaderColumnFiveElement.innerText = "Album Art";

    // Combine all the header cells into the header row
    var tableHeadRowElement = document.createElement("tr");
    tableHeadRowElement.appendChild(tableHeaderColumnOneElement);
    tableHeadRowElement.appendChild(tableHeaderColumnTwoElement);
    tableHeadRowElement.appendChild(tableHeaderColumnThreeElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFourElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFiveElement);

    var tableHeadElement = document.createElement("thead");
    tableHeadElement.appendChild(tableHeadRowElement);

    // For the table body, we want one row in the preview table per track
    var trackNumber = 0;
    var tableBodyElement = document.createElement("tbody");

    for (var track of tracks)
    {
        // Track Number
        trackNumber++;
        var tableBodyHeaderCellElement = document.createElement("th");
        tableBodyHeaderCellElement.setAttribute("scope", "row");
        tableBodyHeaderCellElement.setAttribute("class", "align-middle");
        tableBodyHeaderCellElement.innerText = trackNumber;

        // Track Name
        var tableBodyFirstDataElement = document.createElement("td");
        tableBodyFirstDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyFirstDataElement.innerText = track.name;

        // Artist Name(s)
        var tableBodySecondDataElement = document.createElement("td");
        tableBodySecondDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodySecondDataElement.innerText = getCommaSeparatedArtistNames(track.artists);

        // Album Name
        if (track.album === undefined || track.album === null)
        {
            track.album = {};
        }
        var tableBodyThirdDataElement = document.createElement("td");
        tableBodyThirdDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyThirdDataElement.innerText = track.album.name;

        // Album Art
        var defaultImagePath = "/images/question.png";
        var minimumPixelsPerSide = 64;
        var albumArtPath = getImagePath(track.album.images, minimumPixelsPerSide, defaultImagePath);

        var albumArtImageElement = document.createElement("img");
        albumArtImageElement.setAttribute("class", "img-fluid");
        albumArtImageElement.setAttribute("alt", "Album Named " + track.album.name);
        albumArtImageElement.setAttribute("src", albumArtPath);

        var tableBodyFourthDataElement = document.createElement("td");
        tableBodyFourthDataElement.setAttribute("class", "align-middle col-md-2");
        tableBodyFourthDataElement.appendChild(albumArtImageElement);

        // Combine all the cells together into the table row
        var tableBodyRowElement = document.createElement("tr");
        tableBodyRowElement.appendChild(tableBodyHeaderCellElement);
        tableBodyRowElement.appendChild(tableBodyFirstDataElement);
        tableBodyRowElement.appendChild(tableBodySecondDataElement);
        tableBodyRowElement.appendChild(tableBodyThirdDataElement);
        tableBodyRowElement.appendChild(tableBodyFourthDataElement);

        // Put the table row into the table
        tableBodyElement.appendChild(tableBodyRowElement);
    }

    // Create the table element where the data will reside
    var tableElement = document.createElement("table");
    tableElement.setAttribute("class", "table table-striped table-sm table-hover");
    tableElement.appendChild(tableHeadElement);
    tableElement.appendChild(tableBodyElement);

    // Add a submit button at the end of the preview so that the user can create their smart playlist after checking the preview
    var buttonElement = document.createElement("button");
    buttonElement.setAttribute("id", "createSmartPlaylistButton");
    buttonElement.setAttribute("type", "submit");
    buttonElement.setAttribute("class", "btn btn-info");
    buttonElement.innerText = "Create Smart Playlist";

    // Add an event listener to the smart playlist button
    addOnClickEventListenerToElement(buttonElement, controlLoadingOfFormSubmitAction);

    var buttonDivElement = document.createElement("div");
    buttonDivElement.setAttribute("class", "my-3");
    buttonDivElement.appendChild(buttonElement);

    // Mark the table as responsive and shove the data inside of it
    var previewContainerElement = document.createElement("div");
    previewContainerElement.setAttribute("id", "previewContainer");
    previewContainerElement.setAttribute("class", "table-responsive");
    previewContainerElement.appendChild(headerElement);
    previewContainerElement.appendChild(alertDivElement);
    previewContainerElement.appendChild(tableElement);
    previewContainerElement.appendChild(buttonDivElement);

    // Finally, append all of this new content onto the end of the existing form
    var formElement = document.getElementById("createSmartPlaylistForm");
    formElement.appendChild(previewContainerElement);
}

function restoreGeneratePreviewButton()
{
    // Flip the enablement of the button and restore its text contents
    var eventElement = document.getElementById("generateSmartPlaylistPreviewButton");
    controlEnablementOfElement(eventElement);
    replaceElementContentsWithText(eventElement, "Preview Smart Playlist Tracks");
}

function displayPreviewOutOfDateAlert()
{
    // First, check that there is a playlist preview already generated
    var previewContainerElement = document.getElementById("previewContainer");
    if (previewContainerElement === null)
    {
        return;
    }

    // If there is a playlist preview, and the form has been changed, check for an existing warning
    var previewAlertElement = document.getElementById("previewAlertMessage");
    if (previewAlertElement !== null)
    {
        // Warning already exists, so do not need to do anything
        return;
    }

    // Warning does not exist, so we should create it
    var textElement = document.createTextNode("Warning - Smart playlist rules or settings have changed since this preview was generated.  This preview does not reflect the latest rules and settings.");

    var alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-exclamation-triangle-fill mx-2");

    var alertDivElement = document.createElement("div");
    alertDivElement.setAttribute("id", "previewAlertMessage");
    alertDivElement.setAttribute("class", "alert alert-warning my-3");
    alertDivElement.setAttribute("role", "alert");
    alertDivElement.appendChild(alertImageElement);
    alertDivElement.appendChild(textElement);

    // Now shove that alert at the top of the preview
    // Put the alert here so its easily visible and will be removed when a new preview is generated
    var infoMessageElement = document.getElementById("previewInfoMessage");
    previewContainerElement.insertBefore(alertDivElement, infoMessageElement);
}

function addRuleFormFields()
{
    var ruleIndex = lastActiveRuleIndex + 1;

    // Create pieces of the form row needed for the new rule
    // Rule Type Selection
    var albumOptionRuleType = document.createElement("option");
    albumOptionRuleType.setAttribute("value", "album");
    albumOptionRuleType.innerText = "Album Name";

    var artistOptionRuleType = document.createElement("option");
    artistOptionRuleType.setAttribute("value", "artist");
    artistOptionRuleType.setAttribute("selected", "");
    artistOptionRuleType.innerText = "Artist Name";

    // TODO - Add Genre back in when it is fully developed
    // var genreOptionRuleType = document.createElement("option");
    // genreOptionRuleType.setAttribute("value", "genre");
    // genreOptionRuleType.innerText = "Genre";

    var yearOptionRuleType = document.createElement("option");
    yearOptionRuleType.setAttribute("value", "year");
    yearOptionRuleType.innerText = "Release Year";

    var songOptionRuleType = document.createElement("option");
    songOptionRuleType.setAttribute("value", "song");
    songOptionRuleType.innerText = "Song Name";

    var selectRuleType = document.createElement("select");
    selectRuleType.setAttribute("name", "playlistRuleType-" + ruleIndex);
    selectRuleType.setAttribute("class", "form-control");
    selectRuleType.setAttribute("required", "");
    selectRuleType.appendChild(albumOptionRuleType);
    selectRuleType.appendChild(artistOptionRuleType);
    // TODO - Add Genre back in when it is fully developed
    // selectRuleType.appendChild(genreOptionRuleType);
    selectRuleType.appendChild(yearOptionRuleType);
    selectRuleType.appendChild(songOptionRuleType);

    var ruleTypeDiv = document.createElement("div");
    ruleTypeDiv.setAttribute("class", "col-3");
    ruleTypeDiv.appendChild(selectRuleType);

    // Rule Operator Selection
    var equalOptionRuleOperator = document.createElement("option");
    equalOptionRuleOperator.setAttribute("value", "equal");
    equalOptionRuleOperator.setAttribute("selected", "");
    equalOptionRuleOperator.innerText = "is";

    var notEqualOptionRuleOperator = document.createElement("option");
    notEqualOptionRuleOperator.setAttribute("value", "notEqual");
    notEqualOptionRuleOperator.innerText = "is not";

    var greaterThanOptionRuleOperator = document.createElement("option");
    greaterThanOptionRuleOperator.setAttribute("value", "greaterThan");
    greaterThanOptionRuleOperator.innerText = "is greater than";

    var greaterThanOrEqualToOptionRuleOperator = document.createElement("option");
    greaterThanOrEqualToOptionRuleOperator.setAttribute("value", "greaterThanOrEqual");
    greaterThanOrEqualToOptionRuleOperator.innerText = "is greater than or equal to";

    var lessThanOptionRuleOperator = document.createElement("option");
    lessThanOptionRuleOperator.setAttribute("value", "lessThan");
    lessThanOptionRuleOperator.innerText = "is less than";

    var lessThanOrEqualToOptionRuleOperator = document.createElement("option");
    lessThanOrEqualToOptionRuleOperator.setAttribute("value", "lessThanOrEqual");
    lessThanOrEqualToOptionRuleOperator.innerText = "is less than or equal to";

    var containsOptionRuleOperator = document.createElement("option");
    containsOptionRuleOperator.setAttribute("value", "contains");
    containsOptionRuleOperator.innerText = "contains";

    var selectRuleOperator = document.createElement("select");
    selectRuleOperator.setAttribute("name", "playlistRuleOperator-" + ruleIndex);
    selectRuleOperator.setAttribute("class", "form-control");
    selectRuleOperator.setAttribute("required", "");
    selectRuleOperator.appendChild(equalOptionRuleOperator);
    selectRuleOperator.appendChild(notEqualOptionRuleOperator);
    selectRuleOperator.appendChild(greaterThanOptionRuleOperator);
    selectRuleOperator.appendChild(greaterThanOrEqualToOptionRuleOperator);
    selectRuleOperator.appendChild(lessThanOptionRuleOperator);
    selectRuleOperator.appendChild(lessThanOrEqualToOptionRuleOperator);
    selectRuleOperator.appendChild(containsOptionRuleOperator);

    var ruleOperatorDiv = document.createElement("div");
    ruleOperatorDiv.setAttribute("class", "col-4");
    ruleOperatorDiv.appendChild(selectRuleOperator);

    // Rule Text Data
    var inputRuleTextData = document.createElement("input");
    inputRuleTextData.setAttribute("type", "text");
    inputRuleTextData.setAttribute("name", "playlistRuleData-" + ruleIndex);
    inputRuleTextData.setAttribute("class", "form-control");
    inputRuleTextData.setAttribute("placeholder", "Your Rule Data");
    inputRuleTextData.setAttribute("required", "");

    var ruleTextDataDiv = document.createElement("div");
    ruleTextDataDiv.setAttribute("class", "col-3");
    ruleTextDataDiv.appendChild(inputRuleTextData);

    // Remove Rule Button
    var removeRuleButton = document.createElement("button");
    removeRuleButton.setAttribute("type", "button");
    removeRuleButton.setAttribute("name", "removeRuleButton");
    removeRuleButton.setAttribute("id", "removeRuleButton-" + ruleIndex);
    removeRuleButton.setAttribute("class", "btn btn-outline-danger btn-sm form-control");
    removeRuleButton.innerText = "Remove Rule";

    var removeRuleButtonDiv = document.createElement("div");
    removeRuleButtonDiv.setAttribute("class", "col-2");
    removeRuleButtonDiv.appendChild(removeRuleButton);

    // Add all the components to the top level rule div
    var ruleDiv = document.createElement("div");
    ruleDiv.setAttribute("class", "form-row my-2");
    ruleDiv.setAttribute("id", "rule-" + ruleIndex);
    ruleDiv.appendChild(ruleTypeDiv);
    ruleDiv.appendChild(ruleOperatorDiv);
    ruleDiv.appendChild(ruleTextDataDiv);
    ruleDiv.appendChild(removeRuleButtonDiv);

    // Append a form row of fields for a new rule
    var rulesContainerElement = document.getElementById("rulesContainer");
    rulesContainerElement.appendChild(ruleDiv);

    // Add an event listener to the remove rule button that has been added
    addOnClickEventListenerToElement(removeRuleButton, removeRuleFormFields);

    // Finally, update the index of the last rule in case more are created
    lastActiveRuleIndex = ruleIndex;
}

function removeRuleFormFields()
{
    // There may be multiple buttons for removal, see which one this is by ID
    var eventElementId = event.target.id;
    var index = eventElementId.lastIndexOf("-");
    if (index === -1)
    {
        return;
    }

    var targetRuleNumber = eventElementId.substr(index + 1);
    if (targetRuleNumber === "")
    {
        return;
    }

    // With the rule number, delete the entire rule from the DOM
    // This deletes multiple child nodes, including the event target node
    var targetRuleId = "rule-" + targetRuleNumber;
    var targetRuleElement = document.getElementById(targetRuleId);
    targetRuleElement.remove();
}
