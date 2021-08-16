// Script Logic
var lastActiveRuleIndex = 0;

addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("removeRuleButton-" + lastActiveRuleIndex, removeRuleFormFields);
addOnClickEventListenerToElementById("addRuleButton", addRuleFormFields);

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

function addRuleFormFields()
{
    var ruleIndex = lastActiveRuleIndex + 1;

    // Create pieces of the form row needed for the new rule
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

    // Rule Type Selection
    var artistOptionRuleType = document.createElement("option");
    artistOptionRuleType.setAttribute("value", "artist");
    artistOptionRuleType.setAttribute("selected", "");
    artistOptionRuleType.innerText = "Artist Name";

    var songOptionRuleType = document.createElement("option");
    songOptionRuleType.setAttribute("value", "song");
    songOptionRuleType.innerText = "Song Name";

    var albumOptionRuleType = document.createElement("option");
    albumOptionRuleType.setAttribute("value", "album");
    albumOptionRuleType.innerText = "Album Name";

    var yearOptionRuleType = document.createElement("option");
    yearOptionRuleType.setAttribute("value", "year");
    yearOptionRuleType.innerText = "Release Year";

    var genreOptionRuleType = document.createElement("option");
    genreOptionRuleType.setAttribute("value", "genre");
    genreOptionRuleType.innerText = "Genre";

    var selectRuleType = document.createElement("select");
    selectRuleType.setAttribute("name", "playlistRuleType-" + ruleIndex);
    selectRuleType.setAttribute("class", "form-control");
    selectRuleType.setAttribute("required", "");
    selectRuleType.appendChild(artistOptionRuleType);
    selectRuleType.appendChild(songOptionRuleType);
    selectRuleType.appendChild(albumOptionRuleType);
    selectRuleType.appendChild(yearOptionRuleType);
    selectRuleType.appendChild(genreOptionRuleType);

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

    var lessThanOptionRuleOperator = document.createElement("option");
    lessThanOptionRuleOperator.setAttribute("value", "lessThan");
    lessThanOptionRuleOperator.innerText = "is less than";

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
    selectRuleOperator.appendChild(lessThanOptionRuleOperator);
    selectRuleOperator.appendChild(containsOptionRuleOperator);

    var ruleOperatorDiv = document.createElement("div");
    ruleOperatorDiv.setAttribute("class", "col-3");
    ruleOperatorDiv.appendChild(selectRuleOperator);

    // Rule Text Data
    var inputRuleTextData = document.createElement("input");
    inputRuleTextData.setAttribute("type", "text");
    inputRuleTextData.setAttribute("name", "playlistRuleText-" + ruleIndex);
    inputRuleTextData.setAttribute("class", "form-control");
    inputRuleTextData.setAttribute("placeholder", "Your Rule Data");
    inputRuleTextData.setAttribute("required", "");

    var ruleTextDataDiv = document.createElement("div");
    ruleTextDataDiv.setAttribute("class", "col-4");
    ruleTextDataDiv.appendChild(inputRuleTextData);

    // Add all the components to the top level rule div
    var ruleDiv = document.createElement("div");
    ruleDiv.setAttribute("class", "form-row my-2");
    ruleDiv.setAttribute("id", "rule-" + ruleIndex);
    ruleDiv.appendChild(removeRuleButtonDiv);
    ruleDiv.appendChild(ruleTypeDiv);
    ruleDiv.appendChild(ruleOperatorDiv);
    ruleDiv.appendChild(ruleTextDataDiv)

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

// Generalized Helper Functions
function addOnClickEventListenerToElementById(id, callback)
{
    var element = document.getElementById(id);
    element.addEventListener("click", callback);
}

function controlEnablementOfElementById(id)
{
    var element = document.getElementById(id);
    var isDisabled = element.disabled;
    element.disabled = !isDisabled;
}
