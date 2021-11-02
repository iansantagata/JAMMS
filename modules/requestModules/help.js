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

// Default Constant Values
const successCode = 200;

const contactUserName = "Contact";
const adminUserName = "Admin";
const doNotReplyUserName = "JAMMS.app";

const adminEmail = "admin@jamms.app";
const confirmationEmailSubject = "Contact Confirmation - JAMMS.app";

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
        // Attempt to send an email from contact form to admin based on the user's inputs
        const contactEmail = await environment.getSmtpContactUser();
        const contactPassword = await environment.getSmtpContactPassword();
        const contactEmailConnection = await emailUtils.getEmailConnection(contactEmail, contactPassword);

        const user = await emailUtils.getUser(req);
        req.body.emailTo = emailUtils.getUserString(adminUserName, adminEmail);
        req.body.emailFrom = emailUtils.getUserString(contactUserName, contactEmail);
        req.body.replyTo = user;

        const contactEmailMessage = await emailUtils.getEmailMessage(req);
        await emailUtils.sendEmailMessage(contactEmailConnection, contactEmailMessage);

        // Also, attempt to send confirmation email to the user
        const doNotReplyEmail = await environment.getSmtpDoNotReplyUser();
        const doNotReplyPassword = await environment.getSmtpDoNotReplyPassword();
        const confirmationEmailConnection = await emailUtils.getEmailConnection(doNotReplyEmail, doNotReplyPassword);

        req.body.emailTo = user;
        req.body.emailFrom = emailUtils.getUserString(doNotReplyUserName, doNotReplyEmail);
        req.body.replyTo = null;
        req.body.emailSubject = confirmationEmailSubject;
        req.body.emailBody = await emailUtils.getConfirmationEmailBody(contactEmailMessage);

        const confirmationEmailMessage = await emailUtils.getEmailMessage(req);
        await emailUtils.sendEmailMessage(confirmationEmailConnection, confirmationEmailMessage);

        // Send a success status code back to the user if the emails were successful
        res.sendStatus(successCode);
    }
    catch (error)
    {
        logger.logError(`Failed to send contact email: ${error.message}`);
        errorUtils.handleAjaxError(res);
    }
};
