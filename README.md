[![Build and Deploy via Sync](https://github.com/iansantagata/jamms/actions/workflows/main.yml/badge.svg)](https://github.com/iansantagata/jamms/actions/workflows/main.yml)

## Overview

JAMMS is Just A Music Maintainer for Spotify!

It is meant to modify, manipulate, and maintain Spotify playlists and libraries in ways that are currently not supported natively or easily within Spotify today.

The application's primary motivation is to introduce "smart playlist" functionality within Spotify, similar to older versions of iTunes.

The web application can be found here - https://jamms.app

## Inspiration

JAMMS was inspired by many applications like it, but in particular [PLYLST](https://plylst.app/) which has recently been taken offline.

Although PLYLST is [open source](https://github.com/Shpigford/plylst), JAMMS is meant to approach the same problem for individual users rather than as a service for all users.

## Installation

### Secrets

This application will not run properly without specific secrets (not included in the repository for security reasons).

For more information on where these secrets come from, see [Spotify's documentation on Application Settings](https://developer.spotify.com/documentation/general/guides/app-settings/).

In a development (local) environment, these secrets come from files for easier testing and readability.  In a production environment, these secrets are injected via environment variables with the same names as the secret files.

To run this application locally:

1. In the `secrets/` folder, find a file ending extension `.secret.example`.
2. Copy this example file to a new one with the same name, except it should no longer include `.example` in the extension.
3. Replace the file contents of each `.secret` file locally with the value for that type of secret.
4. Repeat this process for all secrets that have a file extension of `.secret.example`.
5. When complete, there should be just as many `.secret` files as `.secret.example` files.

As an example:

1. Find file `client_id.secret.example` in the `secrets/` folder.
2. Copy this file into `client_id.secret`, leaving `client_id.secret.example` intact and unchanged.
3. Replace the contents of `client_id.secret` with the specific client ID needed for this application.
4. Repeat this process for `client_secret.secret.example` file, this time using the specific client secret needed for this application.
5. Now, there are just as many `.secret` files in the `secrets/` folder as `.secret.example` files, the job is complete!

In a similar example for a production environment, `client_id` would be the name of the environment variable to be injected with its production value.  Note the lack of extension (`.secret`) on this environment variable for production environments.

### Start-Up

*Note* - this application requires both `Node.js` and `npm` in order to run.  You can download both (`npm` comes with `Node.js`) [here](https://nodejs.org).

In order to start-up the application locally, run `npm install` in the root directory of the repository.  This will pull the necessary packages listed in `package.json` and `package-lock.json` from `npm` (Node Package Manager) into the `node_modules/` folder locally.

To start up the application after pulling the dependencies, simply run `node index.js` in the root directory of the repository.

Once the application is started, open a browser and navigate to [http://localhost](http://localhost) to start to interact with it.
