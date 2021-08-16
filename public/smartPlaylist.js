// Script Logic
addOnClickEventListenerToElementById("playlistLimitEnabledInput", controlEnablementOfLimitElements);
addOnClickEventListenerToElementById("playlistOrderEnabledInput", controlEnablementOfOrderElements);

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
