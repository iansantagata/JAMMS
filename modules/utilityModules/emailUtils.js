"use strict";

// Dependencies
const path = require("path"); // URI and local file paths
const nodemailer = require("nodemailer"); // Sending emails

// Utility Modules
const utilityModulesPath = path.join(__dirname, "..", "utilityModules");
const logger = require(path.join(utilityModulesPath, "logger.js"));
const environment = require(path.join(utilityModulesPath, "environment.js"));

// Default Constant Values
const newLine = "\n";

// Email Utilities Logic
exports.getEmailConnection = async function(smtpUser, smtpPassword)
{
    try
    {
        // Build the email connection using login authorization of a user on the SMTP server
        const smtpAuthorization = {
            pass: smtpPassword,
            user: smtpUser
        };

        const smtpHost = await environment.getSmtpHost();
        const smtpPort = await environment.getSmtpPort();

        const connectionOptions = {
            auth: smtpAuthorization,
            host: smtpHost,
            port: smtpPort,
            requireTLS: true,
            secure: true
        };

        // Create the SMTP transport to be able to send emails and verify that it is valid and can be functionally used
        const transporter = nodemailer.createTransport(connectionOptions);
        await transporter.verify();

        return Promise.resolve(transporter);
    }
    catch (error)
    {
        logger.logError(`Failed to get email connection: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getUser = function(req)
{
    try
    {
        if (!req.body)
        {
            throw new Error("Failed to find request body object");
        }

        // First, get the user information of who is sending this email
        const userFirstName = req.body.firstName;
        if (!userFirstName)
        {
            throw new Error("Failed to find valid user first name");
        }

        const userLastName = req.body.lastName;
        if (!userLastName)
        {
            throw new Error("Failed to find valid user last name");
        }

        const userEmailAddress = req.body.emailAddress;
        if (!userEmailAddress)
        {
            throw new Error("Failed to find valid user email address");
        }

        // Now compile all the user information together
        const userName = `${userFirstName} ${userLastName}`;
        const user = exports.getUserString(userName, userEmailAddress);
        return Promise.resolve(user);
    }
    catch (error)
    {
        logger.logError(`Failed to get user information: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getUserString = function(userName, emailAddress)
{
    return `${userName} <${emailAddress}>`;
};

exports.getEmailMessage = function(req)
{
    try
    {
        if (!req.body)
        {
            throw new Error("Failed to find request body object");
        }

        // First, get the user's email data (what they want to say)
        const emailSubject = req.body.emailSubject;
        if (!emailSubject)
        {
            throw new Error("Failed to find valid email subject");
        }

        const emailBody = req.body.emailBody;
        if (!emailBody)
        {
            throw new Error("Failed to find valid email body");
        }

        // Determine who the email will be sent to and from
        const emailFrom = req.body.emailFrom;
        if (!emailFrom)
        {
            throw new Error("Failed to find valid email from");
        }

        const emailTo = req.body.emailTo;
        if (!emailTo)
        {
            throw new Error("Failed to find valid email to");
        }

        // Reply to is optional, so if it is invalid or unpopulated, exclude it
        let replyTo = req.body.replyTo;
        if (!replyTo)
        {
            replyTo = null;
        }

        // Finally, construct the email message with all the validated information
        const emailMessage = {
            disableFileAccess: true,
            disableUrlAccess: true,
            from: emailFrom,
            subject: emailSubject,
            text: emailBody,
            to: emailTo
        };

        // Include reply to if it was valid and populated
        if (replyTo)
        {
            emailMessage.replyTo = replyTo;
        }

        return Promise.resolve(emailMessage);
    }
    catch (error)
    {
        logger.logError(`Failed to construct valid email message: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.sendEmailMessage = async function(emailConnection, emailMessage)
{
    try
    {
        if (!emailConnection)
        {
            throw new Error("Failed to find valid email connection");
        }

        if (!emailMessage)
        {
            throw new Error("Failed to find valid email message");
        }

        // Try to deliver the message - if it fails, it will throw an error
        await emailConnection.sendMail(emailMessage);
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to send email message: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getConfirmationEmailBody = function(message)
{
    try
    {
        let confirmationEmailBody = "";

        const confirmation = "This is a confirmation receipt for your email sent to JAMMS.app.";
        confirmationEmailBody += confirmation;
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        const appreciation = "We thank you for your correspondence and we will get back to you as soon as we are able.";
        confirmationEmailBody += appreciation;
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        const request = "Please do not respond to this message as this account's email is not watched.";
        confirmationEmailBody += request;
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        const reference = "For reference, below is a copy of your email sent to JAMMS.app.";
        confirmationEmailBody += reference;
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        confirmationEmailBody += "------------------------------------------------------";
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        confirmationEmailBody += `Subject: ${message.subject}`;
        confirmationEmailBody += newLine;
        confirmationEmailBody += newLine;

        confirmationEmailBody += message.text;
        confirmationEmailBody += newLine;

        return Promise.resolve(confirmationEmailBody);
    }
    catch (error)
    {
        logger.logError(`Failed to get confirmation email body: ${error.message}`);
        return Promise.reject(error);
    }
};
