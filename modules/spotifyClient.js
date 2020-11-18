// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));

// Spotify URIs
const spotifyGetAllPlaylistsUri = 'https://api.spotify.com/v1/me/playlists';
const spotifyGetSinglePlaylistUri = 'https://api.spotify.com/v1/playlists';
const spotifyCreateSinglePlaylistUri = 'https://api.spotify.com/v1/users';
const spotifyDeleteSinglePlaylistUri = 'https://api.spotify.com/v1/playlists';
const spotifyRestoreSinglePlaylistUri = 'https://api.spotify.com/v1/playlists';

const spotifyGetCurrentUserUri = 'https://api.spotify.com/v1/me';
const spotifyGetTopDataUri = 'https://api.spotify.com/v1/me/top';
const spotifyGetAllTracksUri = 'https://api.spotify.com/v1/me/tracks';
const spotifyGetAllArtistsUri = 'https://api.spotify.com/v1/me/following';
const spotifyGetAllAlbumsUri = 'https://api.spotify.com/v1/me/albums';

// Default Constant Values
const playlistRequestLimitDefault = 9;
const playlistPageNumberDefault = 1;
const artistRequestLimitDefault = 9;
const artistPageNumberDefault = 1;
const artistTimeRangeDefault = 'long_term';
const tracksRequestLimitDefault = 25;
const tracksPageNumberDefault = 1;
const tracksTimeRangeDefault = 'long_term';
const albumsRequestLimitDefault = 9;
const albumsPageNumberDefault = 1;
const createdPlaylistDescription = "Playlist created with JAMM!";

// Spotify Client Logic
exports.getCurrentUserId = async function(req, res)
{
    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the current user's data
    try
    {
        var response = await axios.get(spotifyGetCurrentUserUri, requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
        req.query.playlistsPerPage = 3;
        req.query.pageNumber = 1;
        var playlistResponse = await exports.getAllPlaylists(req, res);

        // Get sample top artists from the user
        req.query.artistsPerPage = 3;
        req.query.pageNumber = 1;
        req.query.timeRange = 'long_term';
        var topArtistsResponse = await exports.getTopArtists(req, res);

        // Get number of artists from the user
        req.query.artistsPerPage = 1;
        req.query.pageNumber = 1;
        var artistsResponse = await exports.getAllArtists(req, res);

        // Get number of albums and sample albums from the user
        req.query.albumsPerPage = 3;
        req.query.pageNumber = 1;
        var albumsResponse = await exports.getAllAlbums(req, res);

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
        console.error(error.message);
        return Promise.reject(error);
    }

    // Now aggregate all of the responses together to a single block of user data
    var fullSpotifyResponse = {
        numberOfPlaylists: playlistResponse.total,
        samplePlaylistData: playlistResponse.items,
        numberOfArtists: artistsResponse.total,
        sampleArtistData: topArtistsResponse.items,
        numberOfTracks: tracksResponse.total,
        sampleTrackData: topTracksResponse.items,
        numberOfAlbums: albumsResponse.total,
        sampleAlbumData: albumsResponse.items
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
            console.log('User requested invalid playlist limit: ' + playlistRequestLimit);
        }
        playlistRequestLimit = playlistRequestLimitDefault;
    }

    if (playlistPageNumber === undefined ||
        playlistPageNumber === null ||
        playlistPageNumber <= 0)
    {
        if (playlistPageNumber !== undefined)
        {
            console.log('User requested invalid playlist page: ' + playlistPageNumber);
        }
        playlistPageNumber = playlistPageNumberDefault;
    }

    var playlistRequestOffset = (playlistPageNumber - 1) * playlistRequestLimit;

    // Make the request to get all playlist data for this user
    var requestData = {
        limit: playlistRequestLimit,
        offset: playlistRequestOffset
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Trigger the request and handle possible responses
    try
    {
        var response = await axios.get(spotifyGetAllPlaylistsUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
        var error = new Error('Invalid playlist ID requested to retrieve: ' + playlistId);
        console.error(error.message);
        return Promise.reject(error);
    }

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the single playlist's data
    try
    {
        var response = await axios.get(spotifyGetSinglePlaylistUri + '/' + playlistId, requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
        var error = new Error('Invalid user ID to create new playlist: ' + userId);
        console.error(error.message);
        return Promise.reject(error);
    }

    var playlistName = req.body.playlistName || null;
    if (playlistName === undefined || playlistName === null)
    {
        var error = new Error('Invalid playlist name to create new playlist: ' + playlistName);
        console.error(error.message);
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

    var requestData = {
        name: playlistName,
        description: playlistDescription,
        public: playlistIsPublic,
        collaborative: playlistIsCollaborative
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res),
            'Content-Type': 'application/json'
        }
    };

    // Make the request to create a new playlist, albeit an empty one to start
    try
    {
        // TODO - Change all the endpoints like this to instead use string replacement for {playlist_id} and use the full URI in the global variable
        var createSinglePlaylistFullUri = spotifyCreateSinglePlaylistUri + '/' + userId + '/playlists';
        var response = await axios.post(createSinglePlaylistFullUri, requestData, requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
        var error = new Error('Invalid playlist ID requested to delete: ' + playlistId);
        console.error(error.message);
        return Promise.reject(error);
    }

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to "unfollow" the playlist, Spotify's way of deleting it from the user's library
    try
    {
        var deleteSinglePlaylistFullUri = spotifyDeleteSinglePlaylistUri + '/' + playlistId + '/followers';
        var response = await axios.delete(deleteSinglePlaylistFullUri, requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
        var error = new Error('Invalid playlist ID requested to restore: ' + playlistId);
        console.error(error.message);
        return Promise.reject(error);
    }

    var requestData = {
        public: true
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res),
            'Content-Type': 'application/json'
        }
    };

    // Make the request to "re-follow" the playlist, Spotify's way of restoring a deleted playlist from the user's library
    try
    {
        var restoreSinglePlaylistFullUri = spotifyRestoreSinglePlaylistUri + '/' + playlistId + '/followers';
        var response = await axios.put(restoreSinglePlaylistFullUri, requestData, requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
            console.log('User requested invalid artist limit: ' + artistRequestLimit);
        }
        artistRequestLimit = artistRequestLimitDefault;
    }

    if (artistPageNumber === undefined ||
        artistPageNumber === null ||
        artistPageNumber <= 0)
    {
        if (artistPageNumber !== undefined)
        {
            console.log('User requested invalid artist page: ' + artistPageNumber);
        }
        artistPageNumber = artistPageNumberDefault;
    }

    if (artistTimeRange !== 'short_term' &&
        artistTimeRange !== 'medium_term' &&
        artistTimeRange !== 'long_term')
    {
        console.log('User requested invalid artist time range: ' + artistTimeRange);
        artistTimeRange = artistTimeRangeDefault;
    }

    var artistRequestOffset = (artistPageNumber - 1) * artistRequestLimit;
    var requestData = {
        limit: artistRequestLimit,
        offset: artistRequestOffset,
        time_range: artistTimeRange
    };

    var requestType = 'artists';
    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the artist data
    try
    {
        var response = await axios.get(spotifyGetTopDataUri + '/' + requestType + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
    // TODO - Since this particular endpoint is cursor based rather than page based,
    // TODO - Will need to setup "after" parameter to point to last ID retrieved
    var artistRequestLimit = req.query.artistsPerPage;

    // Handle the case where the invalid parameters were passed
    if (artistRequestLimit === undefined ||
        artistRequestLimit === null ||
        artistRequestLimit <= 0 ||
        artistRequestLimit > 50)
    {
        if (artistRequestLimit !== undefined)
        {
            console.log('User requested invalid artist limit: ' + artistRequestLimit);
        }
        artistRequestLimit = artistRequestLimitDefault;
    }

    var requestType = 'artist';
    var requestData = {
        type: requestType,
        limit: artistRequestLimit
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the artist data
    try
    {
        var response = await axios.get(spotifyGetAllArtistsUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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

exports.getAllAlbums = async function(req, res)
{
    var albumsRequestLimit = req.query.albumsPerPage;
    var albumsPageNumber = req.query.pageNumber;

    // Handle the case where the invalid parameters were passed
    if (albumsRequestLimit === undefined ||
        albumsRequestLimit === null ||
        albumsRequestLimit <= 0 ||
        albumsRequestLimit > 50)
    {
        if (albumsRequestLimit !== undefined)
        {
            console.log('User requested invalid albums limit: ' + albumsRequestLimit);
        }
        albumsRequestLimit = albumsRequestLimitDefault;
    }

    if (albumsPageNumber === undefined ||
        albumsPageNumber === null ||
        albumsPageNumber <= 0)
    {
        if (albumsPageNumber !== undefined)
        {
            console.log('User requested invalid albums page: ' + albumsPageNumber);
        }
        albumsPageNumber = albumsPageNumberDefault;
    }

    var albumsRequestOffset = (albumsPageNumber - 1) * albumsRequestLimit;
    var requestData = {
        limit: albumsRequestLimit,
        offset: albumsRequestOffset
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the album data
    try
    {
        var response = await axios.get(spotifyGetAllAlbumsUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
            console.log('User requested invalid tracks limit: ' + tracksRequestLimit);
        }
        tracksRequestLimit = tracksRequestLimitDefault;
    }

    if (tracksPageNumber === undefined ||
        tracksPageNumber === null ||
        tracksPageNumber <= 0)
    {
        if (tracksPageNumber !== undefined)
        {
            console.log('User requested invalid tracks page: ' + tracksPageNumber);
        }
        tracksPageNumber = tracksPageNumberDefault;
    }

    var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
    var requestData = {
        limit: tracksRequestLimit,
        offset: tracksRequestOffset
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the track data
    try
    {
        var response = await axios.get(spotifyGetAllTracksUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
            console.log('User requested invalid tracks limit: ' + tracksRequestLimit);
        }
        tracksRequestLimit = tracksRequestLimitDefault;
    }

    if (tracksPageNumber === undefined ||
        tracksPageNumber === null ||
        tracksPageNumber <= 0)
    {
        if (tracksPageNumber !== undefined)
        {
            console.log('User requested invalid tracks page: ' + tracksPageNumber);
        }
        tracksPageNumber = tracksPageNumberDefault;
    }

    if (tracksTimeRange !== 'short_term' &&
        tracksTimeRange !== 'medium_term' &&
        tracksTimeRange !== 'long_term')
    {
        console.log('User requested invalid tracks time range: ' + tracksTimeRange);
        tracksTimeRange = tracksTimeRangeDefault;
    }

    var tracksRequestOffset = (tracksPageNumber - 1) * tracksRequestLimit;
    var requestData = {
        limit: tracksRequestLimit,
        offset: tracksRequestOffset,
        time_range: tracksTimeRange
    };

    var requestType = 'tracks';
    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Make the request to get the track data
    try
    {
        var response = await axios.get(spotifyGetTopDataUri + '/' + requestType + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        console.error(error.message);
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
