"use strict";

// Dependencies
const path = require("path"); // URI and local file paths

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const loginUtils = require(path.join(utilityModulesPath, "loginUtils.js"));
const errorUtils = require(path.join(utilityModulesPath, "errorUtils.js"));
const emailUtils = require(path.join(utilityModulesPath, "emailUtils.js"));
const environment = require(path.join(utilityModulesPath, "environment.js"));
const cookie = require(path.join(utilityModulesPath, "cookie.js"));

// Default Constant Values
const successCode = 200;

const contactUserName = "Contact";
const adminUserName = "Admin";
const doNotReplyUserName = "JAMMS.app";

const adminEmail = "admin@jamms.app";
const confirmationEmailSubject = "Contact Confirmation - JAMMS.app";

const pageLoadKey = "PageLoadTime";
const pageLoadToFormSubmitHumanLowerLimitInMsec = 5000;

// Help Logic
exports.getHelpPage = async function(req, res, next)
{
    try
    {
        // See if the user is already logged in to determine what to show them on the help page
        const isUserLoggedIn = await loginUtils.isUserLoggedIn(req, res);

        const helpPageData = {
            isAwaitingLogin: !isUserLoggedIn
        };

        // Set a cookie with a timestamp of when the help page was last loaded
        const pageLoadTimeStamp = Date.now();
        cookie.setCookie(req, res, pageLoadKey, pageLoadTimeStamp); // Session cookie (no explicit expiration)

        // Render the help page that the user can interact with
        res.location("/help");
        res.render("help", helpPageData);
    }
    catch (error)
    {
        logger.logError(`Failed to get help page: ${error.message}`);
        next(error);
    }
};

exports.sendContactEmail = async function(req, res)
{
    try
    {
        // Determine if we should send a contact form email by validating the user is likely not a bot
        // Page load time to form submit time should be over a reasonable amount (a few seconds) for a human
        const pageLoadTimeStamp = await cookie.getCookie(req, pageLoadKey);

        const formSubmitTimeStamp = Date.now();
        const sendEmail = formSubmitTimeStamp - pageLoadTimeStamp >= pageLoadToFormSubmitHumanLowerLimitInMsec;
        if (sendEmail)
        {
            // Attempt to send an email from contact form to admin based on the user's inputs
            const contactEmailConnection = await getContactEmailConnection();
            const contactEmailMessage = await getContactEmailMessage(req);
            await emailUtils.sendEmailMessage(contactEmailConnection, contactEmailMessage);

            // Also, attempt to send confirmation email to the user
            const confirmationEmailConnection = await getConfirmationEmailConnection();
            const confirmationEmailMessage = await getConfirmationEmailMessage(req, contactEmailMessage);
            await emailUtils.sendEmailMessage(confirmationEmailConnection, confirmationEmailMessage);
        }

        // Send a success status code back to the user if the emails were successful (or if we suspect bot activity)
        res.sendStatus(successCode);
    }
    catch (error)
    {
        logger.logError(`Failed to send contact email: ${error.message}`);
        errorUtils.handleAjaxError(res);
    }
};

// Local Helper Functions
async function getContactEmailConnection()
{
    try
    {
        const contactEmail = await environment.getSmtpContactUser();
        const contactPassword = await environment.getSmtpContactPassword();
        const contactEmailConnection = await emailUtils.getEmailConnection(contactEmail, contactPassword);

        return Promise.resolve(contactEmailConnection);
    }
    catch (error)
    {
        logger.logError(`Failed to get valid connection for contact email: ${error.message}`);
        return Promise.reject(error);
    }
}

async function getConfirmationEmailConnection()
{
    try
    {
        const doNotReplyEmail = await environment.getSmtpDoNotReplyUser();
        const doNotReplyPassword = await environment.getSmtpDoNotReplyPassword();
        const confirmationEmailConnection = await emailUtils.getEmailConnection(doNotReplyEmail, doNotReplyPassword);

        return Promise.resolve(confirmationEmailConnection);
    }
    catch (error)
    {
        logger.logError(`Failed to get valid connection for confirmation email: ${error.message}`);
        return Promise.reject(error);
    }
}

async function getContactEmailMessage(req)
{
    try
    {
        const contactEmail = await environment.getSmtpContactUser();
        const user = await emailUtils.getUser(req);

        req.body.emailTo = emailUtils.getUserString(adminUserName, adminEmail);
        req.body.emailFrom = emailUtils.getUserString(contactUserName, contactEmail);
        req.body.replyTo = user;

        const contactEmailMessage = await emailUtils.getEmailMessage(req);
        return Promise.resolve(contactEmailMessage);
    }
    catch (error)
    {
        logger.logError(`Failed to get contact email message: ${error.message}`);
        return Promise.reject(error);
    }
}

async function getConfirmationEmailMessage(req, contactEmailMessage)
{
    try
    {
        const doNotReplyEmail = await environment.getSmtpDoNotReplyUser();
        const user = await emailUtils.getUser(req);

        req.body.emailTo = user;
        req.body.emailFrom = emailUtils.getUserString(doNotReplyUserName, doNotReplyEmail);
        req.body.replyTo = null;
        req.body.emailSubject = confirmationEmailSubject;
        req.body.emailBody = await emailUtils.getConfirmationEmailBody(contactEmailMessage);

        const confirmationEmailMessage = await emailUtils.getEmailMessage(req);
        return Promise.resolve(confirmationEmailMessage);
    }
    catch (error)
    {
        logger.logError(`Failed to get confirmation email message: ${error.message}`);
        return Promise.reject(error);
    }
}
