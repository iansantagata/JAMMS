// Dependencies
var axios = require("axios"); // Make HTTP requests
var path = require("path"); // URI and local file paths
var querystring = require("querystring"); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, "authorize.js"));
var logger = require(path.join(customModulePath, "logger.js"));

// Spotify URIs
const spotifyBaseUri = "https://api.spotify.com/v1";

const spotifyCurrentUserUriPath = "/me";
const spotifyUsersUriPath = "/users";
const spotifyTopUriPath = "/top";
const spotifyTracksUriPath = "/tracks";
const spotifyFollowingUriPath = "/following";
const spotifyFollowersUriPath = "/followers";
const spotifyPlaylistsUriPath = "/playlists";

// Default Constant Values
const playlistRequestLimitDefault = 10;
const playlistPageNumberDefault = 1;
const artistRequestLimitDefault = 10;
const artistPageNumberDefault = 1;
const artistTimeRangeDefault = "long_term";
const tracksRequestLimitDefault = 10;
const tracksPageNumberDefault = 1;
const tracksTimeRangeDefault = "long_term";
const createdPlaylistDescription = "Playlist created with JAMMS.app!";

// Spotify Client Logic
exports.getCurrentUserId = async function(req, res)
{
    // Make the request to get the current user's data
    try
    {
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetCurrentUserUri = spotifyBaseUri + spotifyCurrentUserUriPath;
        var response = await axios.get(spotifyGetCurrentUserUri, requestOptions);

        // Return only this user's ID
        return Promise.resolve(response.data.id);
    }
    catch (error)
    {
        logger.logError("Failed to get current user ID: " + error.message);
        return Promise.reject(error);
    }
};

exports.getUserData = async function(req, res)
{
    // Call a series of Spotify endpoints to get a small amount of sample data
    // and aggregate metadata about this user's music collection
    try
    {
        // Get number of playlists and sample playlists from the user
        req.query.playlistsPerPage = 10;
        req.query.pageNumber = 1;
        var playlistResponse = await exports.getAllPlaylists(req, res);

        // Get sample top artists from the user
        req.query.artistsPerPage = 10;
        req.query.pageNumber = 1;
        req.query.timeRange = "long_term";
        var topArtistsResponse = await exports.getTopArtists(req, res);

        // Get number of artists from the user
        req.query.artistsPerPage = 1;
        req.query.pageNumber = 1;
        var artistsResponse = await exports.getAllArtists(req, res);

        // Get sample top tracks from the user
        req.query.tracksPerPage = 10;
        req.query.pageNumber = 1;
        req.query.timeRange = "long_term";
        var topTracksResponse = await exports.getTopTracks(req, res);

        // Get number of tracks from the user
        req.query.tracksPerPage = 1;
        req.query.pageNumber = 1;
        var tracksResponse = await exports.getAllTracks(req, res);

        // Now aggregate all of the responses together to a single block of user data
        var fullSpotifyResponse = {
            numberOfPlaylists: playlistResponse.total,
            samplePlaylistData: playlistResponse.items,
            numberOfArtists: artistsResponse.total,
            sampleArtistData: topArtistsResponse.items,
            numberOfTracks: tracksResponse.total,
            sampleTrackData: topTracksResponse.items
        };

        return Promise.resolve(fullSpotifyResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get current user data: " + error.message);
        return Promise.reject(error);
    }
};

exports.getAllPlaylists = async function(req, res)
{
    try
    {
        var playlistRequestLimit = req.query.playlistsPerPage;
        var playlistPageNumber = req.query.pageNumber;

        // Handle the case where the invalid parameters were passed
        if (playlistRequestLimit === undefined || playlistRequestLimit === null)
        {
            logger.logInfo("User requested invalid playlist limit: Value not found. Overwriting with default value.");
            playlistRequestLimit = playlistRequestLimitDefault;
        }

        if (playlistRequestLimit <= 0 || playlistRequestLimit > 50)
        {
            logger.logWarn(`User requested invalid playlist limit: "${playlistRequestLimit}". Overwriting with default value.`);
            playlistRequestLimit = playlistRequestLimitDefault;
        }

        if (playlistPageNumber === undefined || playlistPageNumber === null)
        {
            logger.logInfo("User requested invalid playlist page: Value not found. Overwriting with default value.");
            playlistPageNumber = playlistPageNumberDefault;
        }

        if (playlistPageNumber <= 0)
        {
            logger.logWarn(`User requested invalid playlist page: "${playlistPageNumber}". Overwriting with default value.`);
            playlistPageNumber = playlistPageNumberDefault;
        }

        var playlistRequestOffset = (playlistPageNumber - 1) * playlistRequestLimit;

        // Make the request to get all playlist data for this user
        var requestData = {
            limit: playlistRequestLimit,
            offset: playlistRequestOffset
        };

        // Trigger the request and handle possible responses
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllPlaylistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyPlaylistsUriPath;
        var response = await axios.get(spotifyGetAllPlaylistsUri + "?" + querystring.stringify(requestData), requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get all playlists for user: " + error.message);
        return Promise.reject(error);
    }
};

exports.getSinglePlaylist = async function(req, res)
{
    try
    {
        var playlistId = req.query.playlistId || null;
        if (playlistId === undefined || playlistId === null)
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested`);
        }

        // Make the request to get the single playlist's data
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + "/" + playlistId;
        var response = await axios.get(spotifyGetSinglePlaylistUri, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyResponse = {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            public: response.data.public,
            collaborative: response.data.collaborative,
            followers: response.data.followers,
            images: response.data.images,
            tracks: response.data.tracks
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get playlist: " + error.message);
        return Promise.reject(error);
    }
};

exports.createSinglePlaylist = async function(req, res)
{
    try
    {
        var userId = req.body.userId || null;
        if (userId === undefined || userId === null)
        {
            throw new Error(`Invalid user ID of "${userId}" attempted to create new playlist`);
        }

        var playlistName = req.body.playlistName || null;
        if (playlistName === undefined || playlistName === null)
        {
            throw new Error(`Invalid playlist name of "${playlistName}" provided`);
        }

        var playlistDescription = req.body.playlistDescription || null;
        if (playlistDescription === undefined || playlistDescription === null)
        {
            playlistDescription = createdPlaylistDescription;
        }
        else
        {
            playlistDescription = createdPlaylistDescription + " " + playlistDescription;
        }

        var playlistIsPublic = req.body.playlistIsPublic || null;
        if (playlistIsPublic === undefined || playlistIsPublic === null)
        {
            playlistIsPublic = false;
        }
        else
        {
            playlistIsPublic = true;
        }

        var playlistIsCollaborative = req.body.playlistIsCollaborative || null;
        if (playlistIsCollaborative === undefined || playlistIsCollaborative === null)
        {
            playlistIsCollaborative = false;
        }
        else if (playlistIsCollaborative && playlistIsPublic)
        {
            // Playlists cannot both be collaborative and public, so let public override collaboration
            playlistIsCollaborative = false;
        }
        else
        {
            playlistIsCollaborative = true;
        }

        var requestData = {
            name: playlistName,
            description: playlistDescription,
            public: playlistIsPublic,
            collaborative: playlistIsCollaborative
        };

        // Make the request to create a new playlist, albeit an empty one to start
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        var createSinglePlaylistUri = spotifyBaseUri + spotifyUsersUriPath + "/" + userId + spotifyPlaylistsUriPath;
        var response = await axios.post(createSinglePlaylistUri, requestData, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyResponse = {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            public: response.data.public,
            collaborative: response.data.collaborative,
            followers: response.data.followers,
            images: response.data.images,
            tracks: response.data.tracks
        };

        return Promise.resolve(spotifyResponse);
    }
    catch (error)
    {
        logger.logError("Failed to create playlist: " + error.message);
        return Promise.reject(error);
    }
};

exports.deleteSinglePlaylist = async function(req, res)
{
    try
    {
        var playlistId = req.query.playlistId || null;
        if (playlistId === undefined || playlistId === null)
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested for deletion`);
        }

        // Make the request to "unfollow" the playlist, Spotify's way of deleting it from the user's library
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var deleteSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + "/" + playlistId + spotifyFollowersUriPath;
        await axios.delete(deleteSinglePlaylistUri, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError("Failed to delete playlist: " + error.message);
        return Promise.reject(error);
    }
};

exports.restoreSinglePlaylist = async function(req, res)
{
    try
    {
        var playlistId = req.query.playlistId || null;
        if (playlistId === undefined || playlistId === null)
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" requested for restoration`);
        }

        var requestData = {
            public: true
        };

        // Make the request to "re-follow" the playlist, Spotify's way of restoring a deleted playlist from the user's library
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        var restoreSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + "/" + playlistId + spotifyFollowersUriPath;
        await axios.put(restoreSinglePlaylistUri, requestData, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError("Failed to restore playlist: " + error.message);
        return Promise.reject(error);
    }
};

exports.addTracksToPlaylist = async function(req, res)
{
    try
    {
        var playlistId = req.body.playlistId || null;
        if (playlistId === undefined || playlistId === null)
        {
            throw new Error(`Invalid playlist ID of "${playlistId}" to add songs to`);
        }

        var trackUris = req.body.trackUris || null;
        if (trackUris === undefined || trackUris === null)
        {
            throw new Error(`Invalid track URIs of "${trackUris}" to add to playlist`);
        }

        var requestData = {
            uris: trackUris
        };

        // Make the request to add songs to the playlist
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res),
                "Content-Type": "application/json"
            }
        };

        var addTracksToPlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + "/" + playlistId + spotifyTracksUriPath;
        await axios.post(addTracksToPlaylistUri, requestData, requestOptions);

        // No response message for this endpoint, just return successfully
        return Promise.resolve();
    }
    catch (error)
    {
        logger.logError("Failed to add tracks to playlist: " + error.message);
        return Promise.reject(error);
    }
};

exports.getTopArtists = async function(req, res)
{
    try
    {
        var artistRequestLimit = req.query.artistsPerPage;
        var artistPageNumber = req.query.pageNumber;
        var artistTimeRange = req.query.timeRange;

        // Handle the case where the invalid parameters were passed
        if (artistRequestLimit === undefined || artistRequestLimit === null)
        {
            logger.logInfo("User requested invalid artist limit: Value not found. Overwriting with default value.");
            artistRequestLimit = artistRequestLimitDefault;
        }

        if (artistRequestLimit <= 0 || artistRequestLimit > 50)
        {
            logger.logWarn(`User requested invalid artist limit: "${artistRequestLimit}". Overwriting with default value.`);
            artistRequestLimit = artistRequestLimitDefault;
        }

        if (artistPageNumber === undefined || artistPageNumber === null)
        {
            logger.logInfo("User requested invalid artist page: Value not found. Overwriting with default value.");
            artistPageNumber = artistPageNumberDefault;
        }

        if (artistPageNumber <= 0)
        {
            logger.logWarn(`User requested invalid artist page: "${artistPageNumber}". Overwriting with default value.`);
            artistPageNumber = artistPageNumberDefault;
        }

        if (artistTimeRange !== "short_term" &&
            artistTimeRange !== "medium_term" &&
            artistTimeRange !== "long_term")
        {
            logger.logWarn(`User requested invalid artist time range: "${artistTimeRange}". Overwriting with default value.`);
            artistTimeRange = artistTimeRangeDefault;
        }

        var artistRequestOffset = (artistPageNumber - 1) * artistRequestLimit;
        var requestData = {
            limit: artistRequestLimit,
            offset: artistRequestOffset,
            time_range: artistTimeRange
        };

        var requestType = "artists";

        // Make the request to get the artist data
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetTopDataUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTopUriPath + "/" + requestType;
        var spotifyGetTopDataRequestQuery = "?" + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get top artists: " + error.message);
        return Promise.reject(error);
    }
};

exports.getAllArtists = async function(req, res)
{
    try
    {
        var artistRequestLimit = req.query.artistsPerPage;

        // Handle the case where the invalid parameters were passed
        if (artistRequestLimit === undefined || artistRequestLimit === null)
        {
            logger.logInfo("User requested invalid artist limit: Value not found. Using default value.");
            artistRequestLimit = artistRequestLimitDefault;
        }

        if (artistRequestLimit <= 0 || artistRequestLimit > 50)
        {
            logger.logWarn(`User requested invalid artist limit: "${artistRequestLimit}". Overwriting with default value.`);
            artistRequestLimit = artistRequestLimitDefault;
        }

        var requestType = "artist";
        var requestData = {
            type: requestType,
            limit: artistRequestLimit
        };

        // Make the request to get the artist data
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllArtistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyFollowingUriPath;
        var spotifyGetAllArtistsRequestQuery = "?" + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetAllArtistsUri + spotifyGetAllArtistsRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyPagedResponse = {
            items: response.data.artists.items,
            limit: response.data.artists.limit,
            total: response.data.artists.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get all artists: " + error.message);
        return Promise.reject(error);
    }
};

exports.getAllTracks = async function(req, res)
{
    try
    {
        var tracksRequestLimit = req.query.tracksPerPage;
        var tracksPageNumber = req.query.pageNumber;

        // Handle the case where the invalid parameters were passed
        if (tracksRequestLimit === undefined ||
            tracksRequestLimit === null)
        {
            logger.logInfo("User requested invalid tracks limit: Value not found. Overwriting with default value.");
            tracksRequestLimit = tracksRequestLimitDefault;
        }

        if (tracksRequestLimit <= 0 || tracksRequestLimit > 50)
        {
            logger.logWarn(`User requested invalid tracks limit: "${tracksRequestLimit}". Overwriting with default value.`);
            tracksRequestLimit = tracksRequestLimitDefault;
        }

        if (tracksPageNumber === undefined || tracksPageNumber === null)
        {
            logger.logInfo("User requested invalid tracks page: Value not found. Overwriting with default value.");
            tracksPageNumber = tracksPageNumberDefault;
        }

        if (tracksPageNumber <= 0)
        {
            logger.logWarn(`User requested invalid tracks page: "${tracksPageNumber}". Overwriting with default value.`);
            tracksPageNumber = tracksPageNumberDefault;
        }

        var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
        var requestData = {
            limit: tracksRequestLimit,
            offset: tracksRequestOffset
        };

        // Make the request to get the track data
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllTracksUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTracksUriPath;
        var spotifyGetAllTracksRequestQuery = "?" + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetAllTracksUri + spotifyGetAllTracksRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get all tracks: " + error.message);
        return Promise.reject(error);
    }
};

exports.getTopTracks = async function(req, res)
{
    try
    {
        var tracksRequestLimit = req.query.tracksPerPage;
        var tracksPageNumber = req.query.pageNumber;
        var tracksTimeRange = req.query.timeRange;

        // Handle the case where the invalid parameters were passed
        if (tracksRequestLimit === undefined || tracksRequestLimit === null)
        {
            logger.logInfo("User requested invalid tracks limit: Value not found. Overwriting with default value.");
            tracksRequestLimit = tracksRequestLimitDefault;
        }

        if (tracksRequestLimit <= 0 || tracksRequestLimit > 50)
        {
            logger.logWarn(`User requested invalid tracks limit: "${tracksRequestLimit}". Overwriting with default value.`);
            tracksRequestLimit = tracksRequestLimitDefault;
        }

        if (tracksPageNumber === undefined || tracksPageNumber === null)
        {
            logger.logInfo("User requested invalid tracks page: Value not found. Overwriting with default value.");
            tracksPageNumber = tracksPageNumberDefault;
        }

        if (tracksPageNumber <= 0)
        {
            logger.logWarn(`User requested invalid tracks page: "${tracksPageNumber}". Overwriting with default value.`);
            tracksPageNumber = tracksPageNumberDefault;
        }

        if (tracksTimeRange !== "short_term" &&
            tracksTimeRange !== "medium_term" &&
            tracksTimeRange !== "long_term")
        {
            logger.logWarn(`User requested invalid tracks time range: "${tracksTimeRange}". Overwriting with default value.`);
            tracksTimeRange = tracksTimeRangeDefault;
        }

        var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
        var requestData = {
            limit: tracksRequestLimit,
            offset: tracksRequestOffset,
            time_range: tracksTimeRange
        };

        var requestType = "tracks";

        // Make the request to get the track data
        var requestOptions = {
            headers: {
                "Authorization": await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetTopDataUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTopUriPath + "/" + requestType;
        var spotifyGetTopDataRequestQuery = "?" + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);

        // Extract only the data from the successful response that the user will care to see
        var spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
        };

        return Promise.resolve(spotifyPagedResponse);
    }
    catch (error)
    {
        logger.logError("Failed to get top tracks: " + error.message);
        return Promise.reject(error);
    }
};
