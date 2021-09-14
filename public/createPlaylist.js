// Script Logic
addOnClickEventListenerToElementById("createPlaylistButton", controlLoadingOfSubmitButton);

// DOM Specific Logic
function controlLoadingOfSubmitButton()
{
    var formElementId = "createPlaylistForm";
    var isFormValid = validateFormById(formElementId);

    if (isFormValid)
    {
        var buttonElementId = "createPlaylistButton";
        controlEnablementOfElementById(buttonElementId);
        replaceElementContentsWithLoadingSpinnerById(buttonElementId);

        submitFormById(formElementId);
    }
}
