// Dependencies
var axios = require('axios'); // Make HTTP requests
var path = require('path'); // URI and local file paths
var querystring = require('querystring'); // URI query string manipulation

// Custom Modules
const customModulePath = __dirname;
var authorize = require(path.join(customModulePath, 'authorize.js'));

// Playlist Logic
const spotifyGetUserPlaylistsUri = 'https://api.spotify.com/v1/me/playlists';

const userPlaylistRequestLimitDefault = 9;
const userPlaylistPageNumberDefault = 1;

exports.getAllUserPlaylists = async function(req, res)
{
    // TODO - Handle the case where user passes in a bogus number to either of these (fallback to default)
    var userPlaylistRequestLimit = req.query.playlistsPerPage || userPlaylistRequestLimitDefault;
    var userPlaylistPageNumber = req.query.pageNumber || userPlaylistPageNumberDefault;
    var userPlaylistRequestOffset = (userPlaylistPageNumber - 1) * userPlaylistRequestLimit;

    // Make the request to get all playlist data for this user
    var requestData = {
        limit: userPlaylistRequestLimit,
        offset: userPlaylistRequestOffset
    };

    var requestOptions = {
        headers: {
            'Authorization': await authorize.getAccessTokenFromCookies(req, res)
        }
    };

    // Trigger the request and handle possible responses
    try
    {
        var response = await axios.get(spotifyGetUserPlaylistsUri + '?' + querystring.stringify(requestData), requestOptions);
    }
    catch (error)
    {
        // Restructure the error response to only concern itself with the error message
        console.log(error.message);

        var invalidResponse = {
            errorMessage: error.message
        };

        return Promise.reject(invalidResponse);
    }

    // Extract only the data from the successful response that the user will care to see
    var statusCode = response.status;
    var headers = response.headers;

    var spotifyPagedResponse = {
            items: response.data.items,
            limit: response.data.limit,
            offset: response.data.offset,
            total: response.data.total
    };

    return Promise.resolve(spotifyPagedResponse);
};
