// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));

// Spotify URIs
const spotifyBaseUri = 'https://api.spotify.com/v1';

const spotifyCurrentUserUriPath = '/me';
const spotifyUsersUriPath = '/users';
const spotifyTopUriPath = '/top';
const spotifyTracksUriPath = '/tracks';
const spotifyFollowingUriPath = '/following';
const spotifyFollowersUriPath = '/followers';
const spotifyPlaylistsUriPath = '/playlists';

// Default Constant Values
const playlistRequestLimitDefault = 10;
const playlistPageNumberDefault = 1;
const artistRequestLimitDefault = 10;
const artistPageNumberDefault = 1;
const artistTimeRangeDefault = 'long_term';
const tracksRequestLimitDefault = 10;
const tracksPageNumberDefault = 1;
const tracksTimeRangeDefault = 'long_term';
const createdPlaylistDescription = "Playlist created with JAMMS.app!";

// Spotify Client Logic
exports.getCurrentUserId = async function(req, res)
{
    // Make the request to get the current user's data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetCurrentUserUri = spotifyBaseUri + spotifyCurrentUserUriPath;
        var response = await axios.get(spotifyGetCurrentUserUri, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get current user ID: ' + error.message);
        return Promise.reject(error);
    }

    // Return only this user's ID
    return Promise.resolve(response.data.id);
}

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
        req.query.timeRange = 'long_term';
        var topArtistsResponse = await exports.getTopArtists(req, res);

        // Get number of artists from the user
        req.query.artistsPerPage = 1;
        req.query.pageNumber = 1;
        var artistsResponse = await exports.getAllArtists(req, res);

        // Get sample top tracks from the user
        req.query.tracksPerPage = 10;
        req.query.pageNumber = 1;
        req.query.timeRange = 'long_term';
        var topTracksResponse = await exports.getTopTracks(req, res);

        // Get number of tracks from the user
        req.query.tracksPerPage = 1;
        req.query.pageNumber = 1;
        var tracksResponse = await exports.getAllTracks(req, res);
    }
    catch (error)
    {
        console.error('Failed to get current user data: ' + error.message);
        return Promise.reject(error);
    }

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

exports.getAllPlaylists = async function(req, res)
{
    var playlistRequestLimit = req.query.playlistsPerPage;
    var playlistPageNumber = req.query.pageNumber;

    // Handle the case where the invalid parameters were passed
    if (playlistRequestLimit === undefined ||
        playlistRequestLimit === null ||
        playlistRequestLimit <= 0 ||
        playlistRequestLimit > 50)
    {
        if (playlistRequestLimit !== undefined)
        {
            console.warn('User requested invalid playlist limit: ' + playlistRequestLimit);
        }
        playlistRequestLimit = playlistRequestLimitDefault;
    }

    if (playlistPageNumber === undefined ||
        playlistPageNumber === null ||
        playlistPageNumber <= 0)
    {
        if (playlistPageNumber !== undefined)
        {
            console.warn('User requested invalid playlist page: ' + playlistPageNumber);
        }
        playlistPageNumber = playlistPageNumberDefault;
    }

    var playlistRequestOffset = (playlistPageNumber - 1) * playlistRequestLimit;

    // Make the request to get all playlist data for this user
    var requestData = {
        limit: playlistRequestLimit,
        offset: playlistRequestOffset
    };

    // Trigger the request and handle possible responses
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllPlaylistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyPlaylistsUriPath;
        var response = await axios.get(spotifyGetAllPlaylistsUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get all playlists for user: ' + error.message);
        return Promise.reject(error);
    }

    // Extract only the data from the successful response that the user will care to see
    var spotifyPagedResponse = {
        items: response.data.items,
        limit: response.data.limit,
        offset: response.data.offset,
        total: response.data.total
    };

    return Promise.resolve(spotifyPagedResponse);
};

exports.getSinglePlaylist = async function(req, res)
{
    var playlistId = req.query.playlistId || null;

    if (playlistId === undefined || playlistId === null)
    {
        var error = new Error('Invalid playlist ID of \"' + playlistId + '\" requested');
        console.error('Failed to get playlist: ' + error.message);
        return Promise.reject(error);
    }

    // Make the request to get the single playlist's data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + '/' + playlistId;
        var response = await axios.get(spotifyGetSinglePlaylistUri, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get playlist: ' + error.message);
        return Promise.reject(error);
    }

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

exports.createSinglePlaylist = async function(req, res)
{
    var userId = req.body.userId || null;

    if (userId === undefined || userId === null)
    {
        var error = new Error('Invalid user ID of \"' + userId + '\" attempted to create new playlist');
        console.error('Failed to create playlist: ' + error.message);
        return Promise.reject(error);
    }

    var playlistName = req.body.playlistName || null;
    if (playlistName === undefined || playlistName === null)
    {
        var error = new Error('Invalid playlist name of \"' + playlistName + '\" provided to create new playlist');
        console.error('Failed to create playlist: ' + error.message);
        return Promise.reject(error);
    }

    var playlistDescription = req.body.playlistDescription || null;
    if (playlistDescription === undefined || playlistDescription === null)
    {
        playlistDescription = createdPlaylistDescription;
    }
    else
    {
        playlistDescription = createdPlaylistDescription + ' ' + playlistDescription;
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
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res),
                'Content-Type': 'application/json'
            }
        };

        var createSinglePlaylistUri = spotifyBaseUri + spotifyUsersUriPath + '/' + userId + spotifyPlaylistsUriPath;
        var response = await axios.post(createSinglePlaylistUri, requestData, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to create playlist: ' + error.message);
        return Promise.reject(error);
    }

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

exports.deleteSinglePlaylist = async function(req, res)
{
    var playlistId = req.query.playlistId || null;

    if (playlistId === undefined || playlistId === null)
    {
        var error = new Error('Invalid playlist ID of \"' + playlistId + '\" requested for deletion');
        console.error('Failed to delete playlist: ' + error.message);
        return Promise.reject(error);
    }

    // Make the request to "unfollow" the playlist, Spotify's way of deleting it from the user's library
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var deleteSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + '/' + playlistId + spotifyFollowersUriPath;
        var response = await axios.delete(deleteSinglePlaylistUri, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to delete playlist: ' + error.message);
        return Promise.reject(error);
    }

    // No response message for this endpoint, just return successfully
    return Promise.resolve();
}

exports.restoreSinglePlaylist = async function(req, res)
{
    var playlistId = req.query.playlistId || null;

    if (playlistId === undefined || playlistId === null)
    {
        var error = new Error('Invalid playlist ID of \"' + playlistId + '\" requested for restoration');
        console.error('Failed to restore playlist: ' + error.message);
        return Promise.reject(error);
    }

    var requestData = {
        public: true
    };

    // Make the request to "re-follow" the playlist, Spotify's way of restoring a deleted playlist from the user's library
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res),
                'Content-Type': 'application/json'
            }
        };

        var restoreSinglePlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + '/' + playlistId + spotifyFollowersUriPath;
        var response = await axios.put(restoreSinglePlaylistUri, requestData, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to restore playlist: ' + error.message);
        return Promise.reject(error);
    }

    // No response message for this endpoint, just return successfully
    return Promise.resolve();
}

exports.addTracksToPlaylist = async function(req, res)
{
    var playlistId = req.body.playlistId || null;

    if (playlistId === undefined || playlistId === null)
    {
        var error = new Error('Invalid playlist ID of \"' + playlistId + '\" to add songs to');
        console.error('Failed to add tracks to playlist: ' + error.message);
        return Promise.reject(error);
    }

    var trackUris = req.body.trackUris || null;

    if (trackUris === undefined || trackUris === null)
    {
        var error = new Error('Invalid track URIs of \"' + trackUris + '\" to add to playlist');
        console.error('Failed to add tracks to playlist: ' + error.message);
        return Promise.reject(error);
    }

    var requestData = {
        uris: trackUris
    };

    // Make the request to add songs to the playlist
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res),
                'Content-Type': 'application/json'
            }
        };

        var addTracksToPlaylistUri = spotifyBaseUri + spotifyPlaylistsUriPath + '/' + playlistId + spotifyTracksUriPath;
        var response = await axios.post(addTracksToPlaylistUri, requestData, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to add tracks to playlist: ' + error.message);
        return Promise.reject(error);
    }

    // No response message for this endpoint, just return successfully
    return Promise.resolve();
}

exports.getTopArtists = async function(req, res)
{
    var artistRequestLimit = req.query.artistsPerPage;
    var artistPageNumber = req.query.pageNumber;
    var artistTimeRange = req.query.timeRange;

    // Handle the case where the invalid parameters were passed
    if (artistRequestLimit === undefined ||
        artistRequestLimit === null ||
        artistRequestLimit <= 0 ||
        artistRequestLimit > 50)
    {
        if (artistRequestLimit !== undefined)
        {
            console.warn('User requested invalid artist limit: ' + artistRequestLimit);
        }
        artistRequestLimit = artistRequestLimitDefault;
    }

    if (artistPageNumber === undefined ||
        artistPageNumber === null ||
        artistPageNumber <= 0)
    {
        if (artistPageNumber !== undefined)
        {
            console.warn('User requested invalid artist page: ' + artistPageNumber);
        }
        artistPageNumber = artistPageNumberDefault;
    }

    if (artistTimeRange !== 'short_term' &&
        artistTimeRange !== 'medium_term' &&
        artistTimeRange !== 'long_term')
    {
        console.warn('User requested invalid artist time range: ' + artistTimeRange);
        artistTimeRange = artistTimeRangeDefault;
    }

    var artistRequestOffset = (artistPageNumber - 1) * artistRequestLimit;
    var requestData = {
        limit: artistRequestLimit,
        offset: artistRequestOffset,
        time_range: artistTimeRange
    };

    var requestType = 'artists';

    // Make the request to get the artist data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetTopDataUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTopUriPath + '/' + requestType;
        var spotifyGetTopDataRequestQuery = '?' + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get top artists: ' + error.message);
        return Promise.reject(error);
    }

    // Extract only the data from the successful response that the user will care to see
    var spotifyPagedResponse = {
        items: response.data.items,
        limit: response.data.limit,
        offset: response.data.offset,
        total: response.data.total
    };

    return Promise.resolve(spotifyPagedResponse);
}

exports.getAllArtists = async function(req, res)
{
    var artistRequestLimit = req.query.artistsPerPage;

    // Handle the case where the invalid parameters were passed
    if (artistRequestLimit === undefined ||
        artistRequestLimit === null ||
        artistRequestLimit <= 0 ||
        artistRequestLimit > 50)
    {
        if (artistRequestLimit !== undefined)
        {
            console.warn('User requested invalid artist limit: ' + artistRequestLimit);
        }
        artistRequestLimit = artistRequestLimitDefault;
    }

    var requestType = 'artist';
    var requestData = {
        type: requestType,
        limit: artistRequestLimit
    };

    // Make the request to get the artist data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllArtistsUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyFollowingUriPath;
        var spotifyGetAllArtistsRequestQuery = '?' + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetAllArtistsUri + spotifyGetAllArtistsRequestQuery, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get all artists: ' + error.message);
        return Promise.reject(error);
    }

    // Extract only the data from the successful response that the user will care to see
    var spotifyPagedResponse = {
        items: response.data.artists.items,
        limit: response.data.artists.limit,
        total: response.data.artists.total
    };

    return Promise.resolve(spotifyPagedResponse);
}

exports.getAllTracks = async function(req, res)
{
    var tracksRequestLimit = req.query.tracksPerPage;
    var tracksPageNumber = req.query.pageNumber;

    // Handle the case where the invalid parameters were passed
    if (tracksRequestLimit === undefined ||
        tracksRequestLimit === null ||
        tracksRequestLimit <= 0 ||
        tracksRequestLimit > 50)
    {
        if (tracksRequestLimit !== undefined)
        {
            console.warn('User requested invalid tracks limit: ' + tracksRequestLimit);
        }
        tracksRequestLimit = tracksRequestLimitDefault;
    }

    if (tracksPageNumber === undefined ||
        tracksPageNumber === null ||
        tracksPageNumber <= 0)
    {
        if (tracksPageNumber !== undefined)
        {
            console.warn('User requested invalid tracks page: ' + tracksPageNumber);
        }
        tracksPageNumber = tracksPageNumberDefault;
    }

    var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
    var requestData = {
        limit: tracksRequestLimit,
        offset: tracksRequestOffset
    };

    // Make the request to get the track data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetAllTracksUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTracksUriPath;
        var spotifyGetAllTracksRequestQuery = '?' + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetAllTracksUri + spotifyGetAllTracksRequestQuery, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get all tracks: ' + error.message);
        return Promise.reject(error);
    }

    // Extract only the data from the successful response that the user will care to see
    var spotifyPagedResponse = {
        items: response.data.items,
        limit: response.data.limit,
        offset: response.data.offset,
        total: response.data.total
    };

    return Promise.resolve(spotifyPagedResponse);
}

exports.getTopTracks = async function(req, res)
{
    var tracksRequestLimit = req.query.tracksPerPage;
    var tracksPageNumber = req.query.pageNumber;
    var tracksTimeRange = req.query.timeRange;

    // Handle the case where the invalid parameters were passed
    if (tracksRequestLimit === undefined ||
        tracksRequestLimit === null ||
        tracksRequestLimit <= 0 ||
        tracksRequestLimit > 50)
    {
        if (tracksRequestLimit !== undefined)
        {
            console.warn('User requested invalid tracks limit: ' + tracksRequestLimit);
        }
        tracksRequestLimit = tracksRequestLimitDefault;
    }

    if (tracksPageNumber === undefined ||
        tracksPageNumber === null ||
        tracksPageNumber <= 0)
    {
        if (tracksPageNumber !== undefined)
        {
            console.warn('User requested invalid tracks page: ' + tracksPageNumber);
        }
        tracksPageNumber = tracksPageNumberDefault;
    }

    if (tracksTimeRange !== 'short_term' &&
        tracksTimeRange !== 'medium_term' &&
        tracksTimeRange !== 'long_term')
    {
        console.warn('User requested invalid tracks time range: ' + tracksTimeRange);
        tracksTimeRange = tracksTimeRangeDefault;
    }

    var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
    var requestData = {
        limit: tracksRequestLimit,
        offset: tracksRequestOffset,
        time_range: tracksTimeRange
    };

    var requestType = 'tracks';

    // Make the request to get the track data
    try
    {
        var requestOptions = {
            headers: {
                'Authorization': await authorize.getAccessToken(req, res)
            }
        };

        var spotifyGetTopDataUri = spotifyBaseUri + spotifyCurrentUserUriPath + spotifyTopUriPath + '/' + requestType;
        var spotifyGetTopDataRequestQuery = '?' + querystring.stringify(requestData);
        var response = await axios.get(spotifyGetTopDataUri + spotifyGetTopDataRequestQuery, requestOptions);
    }
    catch (error)
    {
        console.error('Failed to get top tracks: ' + error.message);
        return Promise.reject(error);
    }

    // Extract only the data from the successful response that the user will care to see
    var spotifyPagedResponse = {
        items: response.data.items,
        limit: response.data.limit,
        offset: response.data.offset,
        total: response.data.total
    };

    return Promise.resolve(spotifyPagedResponse);
}
