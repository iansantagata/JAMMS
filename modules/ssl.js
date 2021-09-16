// Dependencies
var path = require('path'); // URI and local file paths
var fs = require('fs'); // File system for accessing local server files
var glob = require('fast-glob'); // Globbing for dynamic file names

// Custom Modules
const customModulePath = __dirname;
var logger = require(path.join(customModulePath, 'logger.js'));

// Default Constant Values
const sslCertExtension = '.crt';
const caBundleExtension = '.ca-bundle';
const sslKeyExtension = '.key';

const allNestedFilesGlob = '**/*';

// SSL Logic
exports.getFullSslCredentials = async function()
{
    try
    {
        // First get the path all the files are located in
        var sslFolderPath = await getSslFolderPath();

        // Next, get the file names and paths of the SSL related files
        var certFilePath = await ssl.getSslCertificateFilePath(sslFolderPath);
        var caBundleFilePath = await ssl.getCertificateAuthorityBundleFilePath(sslFolderPath);
        var keyFilePath = await ssl.getSslKeyFilePath(sslFolderPath);

        // Finally, read the files into string variables and return the lot of them
        var cert = fs.readFileSync(certFilePath);
        var caBundle = fs.readFileSync(caBundleFilePath);
        var key = fs.readFileSync(keyFilePath);

        var fullSslCredentials = {
            cert: cert,
            ca: caBundle,
            key: key
        };

        return Promise.resolve(fullSslCredentials);
    }
    catch (error)
    {
        logger.logError('Failed to get full SSL credentials: ' + error.message);
        return Promise.reject(error);
    }
}

// Local Helper Functions
getSslCertificateFilePath = async function(sslFolderPath)
{
    try
    {
        var globOptions = {
            cwd: sslFolderPath,
            absolute: true
        };

        var certFiles = await glob(allNestedFilesGlob + sslCertExtension, globOptions);
        if (certFiles === undefined || certFiles === null || !certFiles.isArray() || certFiles.length === 0)
        {
            throw new Error('No certificate files found via globbing');
        }

        var certFile = certFiles[0];
        if (certFiles.length > 1)
        {
            logger.logWarn('Found more than one SSL certificate file. Defaulting to first one found.');
        }

        return Promise.resolve(certFile);
    }
    catch (error)
    {
        logger.logError('Failed to locate SSL certificate file path: ' + error.message);
        return Promise.reject(error);
    }
}

getCertificateAuthorityBundleFilePath = async function(sslFolderPath)
{
    try
    {
        var globOptions = {
            cwd: sslFolderPath,
            absolute: true
        };

        var caBundleFiles = await glob(allNestedFilesGlob + caBundleExtension, globOptions);
        if (caBundleFiles === undefined || caBundleFiles === null || !caBundleFiles.isArray() || caBundleFiles.length === 0)
        {
            throw new Error('No CA bundle files found via globbing');
        }

        var caBundleFile = caBundleFiles[0];
        if (caBundleFiles.length > 1)
        {
            logger.logWarn('Found more than one CA bundle file. Defaulting to first one found.');
        }

        return Promise.resolve(caBundleFile);
    }
    catch (error)
    {
        logger.logError('Failed to locate CA bundle file path: ' + error.message);
        return Promise.reject(error);
    }
}

getSslKeyFilePath = async function(sslFolderPath)
{
    try
    {
        var globOptions = {
            cwd: sslFolderPath,
            absolute: true
        };

        var keyFiles = await glob(allNestedFilesGlob + sslKeyExtension, globOptions);
        if (keyFiles === undefined || keyFiles === null || !keyFiles.isArray() || keyFiles.length === 0)
        {
            throw new Error('No SSL key files found via globbing');
        }

        var keyFile = keyFiles[0];
        if (keyFiles.length > 1)
        {
            logger.logWarn('Found more than one SSL key file. Defaulting to first one found.');
        }

        return Promise.resolve(keyFile);
    }
    catch (error)
    {
        logger.logError('Failed to locate SSL key file path: ' + error.message);
        return Promise.reject(error);
    }
}

getSslFolderPath = function()
{
    try
    {
        var path = process.env.SSL_CERT_FOLDER_PATH;
        return Promise.resolve(path);
    }
    catch (error)
    {
        logger.logError('Failed to find environment variable for SSL certificate folder: ' + error.message);
        return Promise.reject(error);
    }
}
