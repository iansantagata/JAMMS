[![Continuous Integration](https://github.com/iansantagata/jamms/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iansantagata/jamms/actions/workflows/continuous-integration.yml)
[![Code QL Scan](https://github.com/iansantagata/jamms/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/iansantagata/jamms/actions/workflows/codeql-analysis.yml)
[![Code Linter](https://github.com/iansantagata/jamms/actions/workflows/linter.yml/badge.svg)](https://github.com/iansantagata/jamms/actions/workflows/linter.yml)

<!-- Test Addition for PR templates -->

## Overview

JAMMS is Just A Music Maintainer for Spotify!

It is meant to modify, manipulate, and maintain Spotify playlists and libraries in ways that are currently not supported natively or easily within Spotify today.

The application's primary motivation is to introduce "smart playlist" functionality within Spotify, similar to older versions of iTunes.

The web application can be found here - https://jamms.app

## Inspiration

JAMMS was inspired by many applications like it, but in particular [PLYLST](https://plylst.app/) which has recently been taken offline.

Although PLYLST is [open source](https://github.com/Shpigford/plylst), JAMMS is meant to approach the same problem for individual users rather than as a service for all users.

## The Future

For bugs, issues, and features to be developed, see the [Issues](https://github.com/iansantagata/jamms/issues) section of this repository.

## Installation

The following is a small guide on how to run this application from source locally. This section is not necessary for users to interact with the hosted version of this web application currently deployed.

For anyone looking to clone or fork this repository, this is a good place to start to get up and running quickly!

### Secrets

This application will not run properly without specific secrets (not included in the repository for security reasons).

For more information on where these secrets come from, see [Spotify's documentation on Application Settings](https://developer.spotify.com/documentation/general/guides/app-settings/).

In a development (local) environment, these secrets come from a `.env` file at the root directory and are hard-coded as key-value pairs.  Within the application, the keys and respective values are injected as environment variables.  In a production environment, these secrets are injected via environment variables with the same name as those present in the `.env` file.

A `.env.example` file is shown at the root directory to provide a list of all secrets (environment variables) that are required for this application in both development and production.

To run this application locally:

1. Copy the `.env.example` file in the root directory to a `.env` file.
2. Replace one value with the appropriate value for each key.
3. Repeat until all keys have their appropriate values in a development environment.

### Start-Up

*Note* - this application requires both `Node.js` and `npm` in order to run.  You can download both (`npm` comes with `Node.js`) [here](https://nodejs.org).

In order to start-up the application locally, run `npm install` in the root directory of the repository.  This will pull the necessary packages listed in `package.json` and `package-lock.json` from `npm` (Node Package Manager) into the `node_modules/` folder locally.

To start up the application after pulling the dependencies, simply run `node index.js` in the root directory of the repository.

Once the application is started, open a browser and navigate to [http://localhost](http://localhost) to start to interact with it.
