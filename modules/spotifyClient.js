"use strict";

// Dependencies
const axios = require("axios"); // Make HTTP requests
const path = require("path"); // URI and local file paths
const querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
const authorize = require(path.join(customModulePath, "authorize.js"));
const logger = require(path.join(customModulePath, "logger.js"));

// Spotify URIs
const spotifyBaseUri = "https://api.spotify.com/v1";

const spotifyCurrentUserUriPath = "/me";
const spotifyUsersUriPath = "/users";
const spotifyTopUriPath = "/top";
const spotifyTracksUriPath = "/tracks";
const spotifyFollowingUriPath = "/following";
const spotifyFollowersUriPath = "/followers";
const spotifyPlaylistsUriPath = "/playlists";
const spotifyArtistsUriPath = "/artists";
const spotifyAudioFeaturesUriPath = "/audio-features";

// Spotify Constants
const spotifyShortTerm = "short_term";
const spotifyMediumTerm = "medium_term";
const spotifyLongTerm = "long_term";

// Default Constant Values
const playlistRequestLimitDefault = 10;
const playlistRequestLimitMax = 50;
const playlistPageNumberDefault = 1;
const artistRequestLimitDefault = 10;
const artistRequestLimitMax = 50;
const artistIdsLimitMax = 50;
const artistPageNumberDefault = 1;
const trackAddToPlaylistLimitMax = 100;
const tracksRequestLimitDefault = 10;
const tracksRequestLimitMax = 50;
const tracksPageNumberDefault = 1;
const trackIdsLimitMax = 100;

const artistTimeRangeDefault = spotifyLongTerm;
const tracksTimeRangeDefault = spotifyLongTerm;
const createdPlaylistDescription = "Playlist created with JAMMS.app!";

// Spotify Client Logic
exports.getCurrentUserId = async function(req, res)
{
    // Make the request to get the current user's data
    try
    {
        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetCurrentUserUri = spotifyBaseUri + spotifyCurrentUserUriPath;
        const response = await axios.get(spotifyGetCurrentUserUri, requestOptions);

        // Return only this user's ID
        return Promise.resolve(response.data.id);
    }
    catch (error)
    {
        logger.logError(`Failed to get current user ID: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getUserData = async function(req, res)
{
    // Call a series of Spotify endpoints to get a small amount of sample data
    // Then, aggregate metadata about this user's music collection
    try
    {
        const defaultDataPointsPerPage = 10;

        // Get number of playlists and sample playlists from the user
        req.query.playlistsPerPage = defaultDataPointsPerPage;
        req.query.pageNumber = 1;
        const playlistResponseAwaitable = exports.getAllPlaylists(req, res);

        // Get sample top artists from the user
        req.query.artistsPerPage = defaultDataPointsPerPage;
        req.query.pageNumber = 1;
        req.query.timeRange = spotifyLongTerm;
        const topArtistsResponseAwaitable = exports.getTopArtists(req, res);

        // Get number of artists from the user
        req.query.artistsPerPage = 1;
        req.query.pageNumber = 1;
        const artistsResponseAwaitable = exports.getAllArtists(req, res);

        // Get sample top tracks from the user
        req.query.tracksPerPage = defaultDataPointsPerPage;
        req.query.pageNumber = 1;
        req.query.timeRange = spotifyLongTerm;
        const topTracksResponseAwaitable = exports.getTopTracks(req, res);

        // Get number of tracks from the user
        req.query.tracksPerPage = 1;
        req.query.pageNumber = 1;
        const tracksResponseAwaitable = exports.getAllTracks(req, res);

        // Resolve all the promises so that we have actual data returned after firing each request off
        const playlistResponse = await playlistResponseAwaitable;
        const topArtistsResponse = await topArtistsResponseAwaitable;
        const artistsResponse = await artistsResponseAwaitable;
        const topTracksResponse = await topTracksResponseAwaitable;
        const tracksResponse = await tracksResponseAwaitable;

        // Now aggregate all of the responses together to a single block of user data
        const fullSpotifyResponse = {
            numberOfArtists: artistsResponse.total,
            numberOfPlaylists: playlistResponse.total,
            numberOfTracks: tracksResponse.total,
            sampleArtistData: topArtistsResponse.items,
            samplePlaylistData: playlistResponse.items,
            sampleTrackData: topTracksResponse.items
        };

        return Promise.resolve(fullSpotifyResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get current user data: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAllPlaylists = async function(req, res)
{
    try
    {
        // Handle cases where invalid parameters were passed for request limit
        const playlistRequestLimit = req.query.playlistsPerPage
            ? parseInt(req.query.playlistsPerPage, 10) // User specified value is present
            : playlistRequestLimitDefault; // Value not present, use default

        if (isNaN(playlistRequestLimit) || playlistRequestLimit <= 0 || playlistRequestLimit > playlistRequestLimitMax)
        {
            throw new Error(`Invalid playlists per page limit of "${playlistRequestLimit}" requested`);
        }

        // Handle cases where invalid parameters were passed for page number
        const playlistPageNumber = req.query.pageNumber
            ? parseInt(req.query.pageNumber, 10) // User specified value is present
            : playlistPageNumberDefault; // Value not present, use default

        if (isNaN(playlistPageNumber) || playlistPageNumber <= 0)
        {
            throw new Error(`Invalid playlist page number of "${playlistPageNumber}" requested`);
        }

        // Convert page number that user sees to starting offset (basically an index) to retrieve data from the API
        const playlistRequestOffset = (playlistPageNumber - 1) * playlistRequestLimit;

        // Make the request to get all playlist data for this user
        const requestData = {
            limit: playlistRequestLimit,
            offset: playlistRequestOffset
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetAllPlaylistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyPlaylistsUriPath;
        const response = await axios.get(`${spotifyGetAllPlaylistsUri}?${querystring.stringify(requestData)}`, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get all playlists for user: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getSinglePlaylist = async function(req, res)
{
    try
    {
        const playlistId = req.query.playlistId;
        if (!playlistId || typeof playlistId !== "string")
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested`);
        }

        // Make the request to get the single playlist's data
        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetSinglePlaylistUri = `${spotifyBaseUri}${spotifyPlaylistsUriPath}/${playlistId}`;
        const response = await axios.get(spotifyGetSinglePlaylistUri, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyResponse = {
            collaborative: response.data.collaborative,
            description: response.data.description,
            followers: response.data.followers,
            id: response.data.id,
            images: response.data.images,
            name: response.data.name,
            public: response.data.public,
            tracks: response.data.tracks
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get playlist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.createSinglePlaylist = async function(req, res)
{
    try
    {
        const userId = req.body.userId;
        if (!userId || typeof userId !== "string")
        {
            throw new Error(`Invalid user ID of "${userId}" attempted to create new playlist`);
        }

        const playlistName = req.body.playlistName;
        if (!playlistName || typeof playlistName !== "string")
        {
            throw new Error(`Invalid playlist name of "${playlistName}" provided`);
        }

        let playlistDescription = req.body.playlistDescription;
        if (!playlistDescription || typeof playlistDescription !== "string")
        {
            // Handle playlist descriptions differently if there is none or there is an error
            // App can just default to a playlist description in that case
            playlistDescription = createdPlaylistDescription;
        }
        else
        {
            playlistDescription = `${createdPlaylistDescription} ${playlistDescription}`;
        }

        const playlistIsPublic = Boolean(req.body.playlistIsPublic);
        let playlistIsCollaborative = Boolean(req.body.playlistIsCollaborative);

        // Playlists cannot both be collaborative and public, so let public override collaboration
        if (playlistIsCollaborative && playlistIsPublic)
        {
            playlistIsCollaborative = false;
        }

        const requestData = {
            collaborative: playlistIsCollaborative,
            description: playlistDescription,
            name: playlistName,
            public: playlistIsPublic
        };

        // Make the request to create a new playlist, albeit an empty one to start
        const requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        const createSinglePlaylistUri = `${spotifyBaseUri}${spotifyUsersUriPath}/${userId}${spotifyPlaylistsUriPath}`;
        const response = await axios.post(createSinglePlaylistUri, requestData, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyResponse = {
            collaborative: response.data.collaborative,
            description: response.data.description,
            followers: response.data.followers,
            id: response.data.id,
            images: response.data.images,
            name: response.data.name,
            public: response.data.public,
            tracks: response.data.tracks
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to create playlist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.deleteSinglePlaylist = async function(req, res)
{
    try
    {
        const playlistId = req.query.playlistId;
        if (!playlistId || typeof playlistId !== "string")
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested for deletion`);
        }

        // Make the request to "unfollow" the playlist, Spotify's way of deleting it from the user's library
        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const deleteSinglePlaylistUri = `${spotifyBaseUri}${spotifyPlaylistsUriPath}/${playlistId}${spotifyFollowersUriPath}`;
        await axios.delete(deleteSinglePlaylistUri, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to delete playlist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.restoreSinglePlaylist = async function(req, res)
{
    try
    {
        const playlistId = req.query.playlistId;
        if (!playlistId || typeof playlistId !== "string")
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested for restoration`);
        }

        const requestData = {
            public: true
        };

        // Make the request to "re-follow" the playlist, Spotify's way of restoring a deleted playlist from the user's library
        const requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        const restoreSinglePlaylistUri = `${spotifyBaseUri}${spotifyPlaylistsUriPath}/${playlistId}${spotifyFollowersUriPath}`;
        await axios.put(restoreSinglePlaylistUri, requestData, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to restore playlist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.addTracksToPlaylist = async function(req, res)
{
    try
    {
        const playlistId = req.body.playlistId;
        if (!playlistId || typeof playlistId !== "string")
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" to add songs to`);
        }

        const trackUris = req.body.trackUris;
        if (!trackUris || !Array.isArray(trackUris))
        {
            throw new Error(`Invalid track URIs of "${trackUris}" to add to playlist`);
        }

        if (trackUris.length <= 0 || trackUris.length > trackAddToPlaylistLimitMax)
        {
            throw new Error(`Invalid number of track URIs of "${trackUris.length}"`);
        }

        const requestData = {
            uris: trackUris
        };

        // Make the request to add songs to the playlist
        const requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        const addTracksToPlaylistUri = `${spotifyBaseUri}${spotifyPlaylistsUriPath}/${playlistId}${spotifyTracksUriPath}`;
        await axios.post(addTracksToPlaylistUri, requestData, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError(`Failed to add tracks to playlist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getTopArtists = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to the artist limit
        const artistRequestLimit = req.query.artistsPerPage
            ? parseInt(req.query.artistsPerPage, 10) // User specified value is present
            : artistRequestLimitDefault; // Value not specified, use default

        if (isNaN(artistRequestLimit) || artistRequestLimit <= 0 || artistRequestLimit > artistRequestLimitMax)
        {
            throw new Error(`Invalid artists per page limit of "${artistRequestLimit}" requested`);
        }

        // Handle the case where the invalid parameters were passed to the artist page number
        const artistPageNumber = req.query.pageNumber
            ? parseInt(req.query.pageNumber) // User specified value is present
            : artistPageNumberDefault; // Value not specified, use default

        if (isNaN(artistPageNumber) || artistPageNumber <= 0)
        {
            throw new Error(`Invalid artist page number of "${artistPageNumber}" requested`);
        }

        // Handle the case where the invalid parameters were passed to the artist time range
        const artistTimeRange = req.query.timeRange || artistTimeRangeDefault;
        if (typeof artistTimeRange !== "string" ||
            (artistTimeRange !== spotifyShortTerm &&
            artistTimeRange !== spotifyMediumTerm &&
            artistTimeRange !== spotifyLongTerm))
        {
            throw new Error(`Invalid artist time range of "${artistTimeRange}" requested`);
        }

        // Convert page number to offset (basically an index) for API usage
        const artistRequestOffset = (artistPageNumber - 1) * artistRequestLimit;

        // Make the request to get the artist data
        const requestType = "artists";
        const requestData = {
            limit: artistRequestLimit,
            offset: artistRequestOffset,
            time_range: artistTimeRange
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetTopDataUri = `${spotifyBaseUri}${spotifyCurrentUserUriPath}${spotifyTopUriPath}/${requestType}`;
        const spotifyGetTopDataRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get top artists: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getMultipleArtists = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to artist ID
        const artistIds = req.query.artistIds;
        if (!Array.isArray(artistIds))
        {
            throw new Error(`Invalid artist IDs requested: "${artistIds}"`);
        }

        if (artistIds.length <= 0 || artistIds.length > artistIdsLimitMax)
        {
            throw new Error(`Invalid number of artist IDs requested: ${artistIds.length}`);
        }

        const concatenatedArtistIds = artistIds
            .filter(id => Boolean(id))
            .join(",");

        if (!concatenatedArtistIds)
        {
            throw new Error(`Invalid artist IDs requested after concatenating: ${concatenatedArtistIds}`);
        }

        // Make the request to get each artist's data
        const requestData = {
            ids: concatenatedArtistIds
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetMultipleArtistsUri = `${spotifyBaseUri}${spotifyArtistsUriPath}`;
        const spotifyGetMultipleArtistsRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetMultipleArtistsUri + spotifyGetMultipleArtistsRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyResponse = {
            artists: response.data.artists
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get artist: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAllArtists = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to artist limit
        const artistRequestLimit = req.query.artistsPerPage
            ? parseInt(req.query.artistsPerPage) // User specified value is present
            : artistRequestLimitDefault; // Value not specified, use default

        if (isNaN(artistRequestLimit) || artistRequestLimit <= 0 || artistRequestLimit > artistRequestLimitMax)
        {
            throw new Error(`Invalid artists per page limit of "${artistRequestLimit}" requested`);
        }

        // Make the request to get the artist data
        const requestType = "artist";
        const requestData = {
            limit: artistRequestLimit,
            type: requestType
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetAllArtistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyFollowingUriPath;
        const spotifyGetAllArtistsRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetAllArtistsUri + spotifyGetAllArtistsRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyPagedResponse = {
            items: response.data.artists.items,
            limit: response.data.artists.limit,
            total: response.data.artists.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get all artists: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAllTracks = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to tracks limit
        const tracksRequestLimit = req.query.tracksPerPage
            ? parseInt(req.query.tracksPerPage) // User specified value is present
            : tracksRequestLimitDefault; // Value not specified, use default

        if (isNaN(tracksRequestLimit) || tracksRequestLimit <= 0 || tracksRequestLimit > tracksRequestLimitMax)
        {
            throw new Error(`Invalid tracks per page limit of "${tracksRequestLimit}" requested`);
        }

        // Handle the case where the invalid parameters were passed to tracks page number
        const tracksPageNumber = req.query.pageNumber
            ? parseInt(req.query.pageNumber) // User specified value is present
            : tracksPageNumberDefault; // Value not specified, use default

        if (isNaN(tracksPageNumber) || tracksPageNumber <= 0)
        {
            throw new Error(`Invalid tracks page number of "${tracksPageNumber}" requested`);
        }

        // Convert page number to offset (basically an index) for API data retrieval
        const tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;

        // Make the request to get the track data
        const requestData = {
            limit: tracksRequestLimit,
            offset: tracksRequestOffset
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetAllTracksUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTracksUriPath;
        const spotifyGetAllTracksRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetAllTracksUri + spotifyGetAllTracksRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get all tracks: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getTopTracks = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to track limit
        const tracksRequestLimit = req.query.tracksPerPage
            ? parseInt(req.query.tracksPerPage) // User specified value is present
            : tracksRequestLimitDefault; // Value not specified, use default

        if (isNaN(tracksRequestLimit) || tracksRequestLimit <= 0 || tracksRequestLimit > tracksRequestLimitMax)
        {
            throw new Error(`Invalid tracks per page limit of "${tracksRequestLimit}" requested`);
        }

        // Handle the case where the invalid parameters were passed to track page number
        const tracksPageNumber = req.query.pageNumber
            ? parseInt(req.query.pageNumber, 10) // User specified value is present
            : tracksPageNumberDefault; // Value not specified, use default

        if (isNaN(tracksPageNumber) || tracksPageNumber <= 0)
        {
            throw new Error(`Invalid tracks page number of "${tracksPageNumber}" requested`);
        }

        // Handle the case where the invalid parameters were passed to track time range
        const tracksTimeRange = req.query.timeRange || tracksTimeRangeDefault;
        if (typeof tracksTimeRange !== "string" ||
            (tracksTimeRange !== spotifyShortTerm &&
            tracksTimeRange !== spotifyMediumTerm &&
            tracksTimeRange !== spotifyLongTerm))
        {
            throw new Error(`Invalid tracks time range of "${tracksTimeRange}" requested`);
        }

        // Convert page number to offset (basically an index) for API data retrieval
        const tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;

        // Make the request to get the track data
        const requestType = "tracks";
        const requestData = {
            limit: tracksRequestLimit,
            offset: tracksRequestOffset,
            time_range: tracksTimeRange
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetTopDataUri = `${spotifyBaseUri}${spotifyCurrentUserUriPath}${spotifyTopUriPath}/${requestType}`;
        const spotifyGetTopDataRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get top tracks: ${error.message}`);
        return Promise.reject(error);
    }
};

exports.getAudioFeatures = async function(req, res)
{
    try
    {
        // Handle the case where the invalid parameters were passed to track IDs
        const trackIds = req.query.trackIds;
        if (!Array.isArray(trackIds))
        {
            throw new Error(`Invalid track IDs requested: "${trackIds}"`);
        }

        if (trackIds.length <= 0 || trackIds.length > trackIdsLimitMax)
        {
            throw new Error(`Invalid number of track IDs requested: ${trackIds.length}`);
        }

        const concatenatedTrackIds = trackIds
            .filter(id => Boolean(id))
            .join(",");

        if (!concatenatedTrackIds)
        {
            throw new Error(`Invalid track IDs requested after concatenating: ${concatenatedTrackIds}`);
        }

        // Make the request to get each track's audio feature data
        const requestData = {
            ids: concatenatedTrackIds
        };

        const requestOptions = {
            headers: {
                Authorization: await authorize.getAccessToken(req, res)
            }
        };

        const spotifyGetAudioFeaturesUri = `${spotifyBaseUri}${spotifyAudioFeaturesUriPath}`;
        const spotifyGetAudioFeaturesRequestQuery = `?${querystring.stringify(requestData)}`;
        const response = await axios.get(spotifyGetAudioFeaturesUri + spotifyGetAudioFeaturesRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        const spotifyResponse = {
            audioFeatures: response.data.audio_features
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError(`Failed to get audio features: ${error.message}`);
        return Promise.reject(error);
    }
};
