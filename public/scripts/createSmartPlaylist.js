// Script Logic
var lastActiveRuleIndex = 0;

addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("removeRuleButton-" + lastActiveRuleIndex, removeRuleFormFields);
addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);

addOnClickEventListenerToElementById("generateSmartPlaylistPreviewButton", previewSmartPlaylist);
addOnClickEventListenerToElementById("createSmartPlaylistButton", controlLoadingOfFormSubmitAction);

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

    controlEnablementOfElement(eventElement);
    replaceElementContentsWithLoadingIndicator(eventElement, true);

    var formData = new FormData(formElement);
    var plainFormData = Object.fromEntries(formData.entries());
    var formDataJson = JSON.stringify(plainFormData);

    var fetchOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: formDataJson
    };

    // Make the AJAX call and handle the response
    fetch("/getSmartPlaylistPreview", fetchOptions)
        .then(response => response.json())
        .then(displaySmartPlaylistPreview)
        .catch(error => console.error(error.message));
        // TODO - Add a finally where the generate preview button is restored (not loading anymore and enabled again)
}

function displaySmartPlaylistPreview(data)
{
    // TODO - If there are no tracks returned, handle that case

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

    var tableHeadRowElement = document.createElement("tr");
    tableHeadRowElement.appendChild(tableHeaderColumnOneElement);
    tableHeadRowElement.appendChild(tableHeaderColumnTwoElement);
    tableHeadRowElement.appendChild(tableHeaderColumnThreeElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFourElement);
    tableHeadRowElement.appendChild(tableHeaderColumnFiveElement);

    var tableHeadElement = document.createElement("thead");
    tableHeadElement.appendChild(tableHeadRowElement);

    // For every song, we want one row in the preview table
    var trackCounter = 0;
    var tableBodyElement = document.createElement("tbody");

    for (var savedTrackData of data)
    {
        trackCounter++;
        var track = savedTrackData.track;

        var tableBodyHeaderCellElement = document.createElement("th");
        tableBodyHeaderCellElement.setAttribute("scope", "row");
        tableBodyHeaderCellElement.setAttribute("class", "align-middle");
        tableBodyHeaderCellElement.innerText = trackCounter;

        var tableBodyFirstDataElement = document.createElement("td");
        tableBodyFirstDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyFirstDataElement.innerText = track.name;

        var tableBodySecondDataElement = document.createElement("td");
        tableBodySecondDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodySecondDataElement.innerText = concatenateArtistNames(track);

        var tableBodyThirdDataElement = document.createElement("td");
        tableBodyThirdDataElement.setAttribute("class", "align-middle text-capitalize");
        tableBodyThirdDataElement.innerText = track.album.name;

        var albumArtPath = getVisibleAlbumArtPath(track.album);
        var albumArtImageElement = document.createElement("img");
        albumArtImageElement.setAttribute("class", "img-fluid");
        albumArtImageElement.setAttribute("alt", "Album Named " + track.album.name);
        albumArtImageElement.setAttribute("src", albumArtPath);

        var tableBodyFourthDataElement = document.createElement("td");
        tableBodyFourthDataElement.setAttribute("class", "align-middle col-md-2");
        tableBodyFourthDataElement.appendChild(albumArtImageElement);

        var tableBodyRowElement = document.createElement("tr");
        tableBodyRowElement.appendChild(tableBodyHeaderCellElement);
        tableBodyRowElement.appendChild(tableBodyFirstDataElement);
        tableBodyRowElement.appendChild(tableBodySecondDataElement);
        tableBodyRowElement.appendChild(tableBodyThirdDataElement);
        tableBodyRowElement.appendChild(tableBodyFourthDataElement);

        tableBodyElement.appendChild(tableBodyRowElement);
    }

    // Create the table element where the data will reside
    var tableElement = document.createElement("table");
    tableElement.setAttribute("class", "table table-striped table-sm table-hover");
    tableElement.appendChild(tableHeadElement);
    tableElement.appendChild(tableBodyElement);

    // Add a header to indicate that this is the preview tracks section
    var headerElement = document.createElement("h4");
    headerElement.setAttribute("class", "my-3");
    headerElement.innerText = "Smart Playlist Track Preview"

    // TODO - Put a notification here that there is a limited number of songs in the preview, maybe if the user goes over this limit

    // Mark the table as responsive and shove the data inside of it
    var previewContainerElement = document.createElement("div")
    previewContainerElement.setAttribute("id", "previewContainer");
    previewContainerElement.setAttribute("class", "table-responsive");
    previewContainerElement.appendChild(headerElement);
    previewContainerElement.appendChild(tableElement);

    var formElement = document.getElementById("createSmartPlaylistForm");
    formElement.appendChild(previewContainerElement);

    // TODO - Add the submit button back here
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
    ruleDiv.appendChild(ruleTextDataDiv)
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

// TODO - Move this to helper functions and perhaps rename
function concatenateArtistNames(track)
{
    var artistNames = "";

    // Smush all the artists of a track together into a comma separated string
    for (var artist of track.artists)
    {
        artistNames = artistNames + artist.name + ", ";
    }

    // Remove the trailing comma and space
    artistNames = artistNames.substring(0, artistNames.length - 2);
    return artistNames;
}

// TODO - Perhaps move this to helper functions and rename
function getVisibleAlbumArtPath(album)
{
    // Images are ordered from widest to smallest width, so start at the end to keep images small-ish yet reasonably visible
    var imageIndex = album.images.length - 1;

    // We want images that are at least over 64 pixels in both dimensions for the user to see them
    // If there are none, we will end up using the first and biggest image
    while (imageIndex > 0 &&
      album.images[imageIndex] !== undefined &&
      (album.images[imageIndex].width < 64 ||
      album.images[imageIndex].height < 64))
    {
        imageIndex = imageIndex - 1;
    }

    if (album.images[imageIndex] !== undefined)
    {
        return album.images[imageIndex].url;
    }

    // If no image was found, use the default album art image signifying this
    return "images/question.png";
}
