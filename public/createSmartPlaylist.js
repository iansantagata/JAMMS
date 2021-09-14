// Script Logic
var lastActiveRuleIndex = 0;

addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("removeRuleButton-" + lastActiveRuleIndex, removeRuleFormFields);
addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);

addOnClickEventListenerToElementById("createSmartPlaylistButton", controlLoadingOfSubmitButton);

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

function controlLoadingOfSubmitButton()
{
    var formElementId = "createSmartPlaylistForm";
    var isFormValid = validateFormById(formElementId);

    if (isFormValid)
    {
        var buttonElementId = "createSmartPlaylistButton";
        controlEnablementOfElementById(buttonElementId);
        replaceElementContentsWithLoadingSpinnerById(buttonElementId);

        submitFormById(formElementId);
    }
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

    var genreOptionRuleType = document.createElement("option");
    genreOptionRuleType.setAttribute("value", "genre");
    genreOptionRuleType.innerText = "Genre";

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
    selectRuleType.appendChild(genreOptionRuleType);
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
    addOnClickEventListenerToElementById("removeRuleButton-" + ruleIndex, removeRuleFormFields);

    // Finally, update the index of the last rule in case more are created
    lastActiveRuleIndex = ruleIndex;
}

function removeRuleFormFields()
{
    // There may be multiple buttons for removal, see which one this is by ID
    var eventElementId = event.currentTarget.id;
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
    var targetRuleId = "rule-" + targetRuleNumber;
    var targetRuleElement = document.getElementById(targetRuleId);
    targetRuleElement.remove();
}
