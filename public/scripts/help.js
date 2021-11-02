"use strict";

// Script Logic
addOnClickEventListenerToElementById("sendEmailButton", sendContactEmail);

// DOM Specific Functions
function sendContactEmail()
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
    const errorAlertElement = document.getElementById("sendEmailErrorMessage");
    if (errorAlertElement)
    {
        errorAlertElement.remove();
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

    // Make the AJAX call and handle the response
    fetch("/sendEmail", fetchOptions)
        .then(checkResponseCodeValidity)
        .then(handleEmailSendSuccess)
        .catch(handleSendContactEmailError);
}

function handleSendContactEmailError(error)
{
    // Log the error to the console first
    console.error(`Failed to send contact email: ${error.message}`);

    // Put an error alert in the alert container to show the user there was a problem
    const alertTextElement = document.createTextNode("Error - Failed to send contact email. Please validate your data and try again.");

    const alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi-x-circle-fill mx-2");

    const responseFailureAlertElement = document.createElement("div");
    responseFailureAlertElement.setAttribute("class", "alert alert-danger");
    responseFailureAlertElement.setAttribute("role", "alert");
    responseFailureAlertElement.setAttribute("id", "sendEmailErrorMessage");
    responseFailureAlertElement.appendChild(alertImageElement);
    responseFailureAlertElement.appendChild(alertTextElement);

    const alertContainer = document.getElementById("alertContainer");
    alertContainer.appendChild(responseFailureAlertElement);

    // Finally, restore the form submit button so the user can try again if they wish to
    const eventElement = document.getElementById("sendEmailButton");
    controlEnablementOfElement(eventElement);
    replaceElementContentsWithText(eventElement, "Submit");
}

function handleEmailSendSuccess(response)
{
    // With a successful email sent, remove the form since it was used successfully
    const formElement = document.getElementById("contactForm");
    formElement.remove();

    // Add a message saying the email was successfully sent to show to the user
    const alertTextElement = document.createTextNode("Email successfully sent!");

    const alertImageElement = document.createElement("i");
    alertImageElement.setAttribute("class", "bi bi-check-circle-fill mx-2");

    const responseSuccessAlertElement = document.createElement("div");
    responseSuccessAlertElement.setAttribute("class", "alert alert-success");
    responseSuccessAlertElement.setAttribute("role", "alert");
    responseSuccessAlertElement.setAttribute("id", "sendEmailSuccessMessage");
    responseSuccessAlertElement.appendChild(alertImageElement);
    responseSuccessAlertElement.appendChild(alertTextElement);

    const alertContainer = document.getElementById("alertContainer");
    alertContainer.appendChild(responseSuccessAlertElement);
}
