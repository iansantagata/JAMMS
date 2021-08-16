// Script Logic
var lastActiveRuleIndex = 0;

addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

addOnClickEventListenerToElementById("removeRuleButton-" + lastActiveRuleIndex, removeRuleFormFields);

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
