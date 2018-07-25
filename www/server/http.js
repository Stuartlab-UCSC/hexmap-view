
// http.js
// Handle incoming HTTP requests.

import bookmark from './bookmark';

function respond (statusCode, res, data_in) {

    // This responds to an http request before converting data to json.
    var data = JSON.stringify(data_in);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(data + '\n');
}

function passPostChecks (req, res) {

    // Do some basic checks on the request headers,
    // returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respond(405, res, 'Only the POST method is understood here');
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respond(400, res,
            'Only content-type of application/json is understood here');
    }
}

function parseJson (jsonData, res) {

    // Parse the json data.
    let data = null
    try {
        data = JSON.parse(jsonData);
    } catch (e) {
        var msg = 'server error decoding JSON: ' + e;
        respond(500, res, {error: msg });
        return;
    }
    return data
}

async function updateBookmarkDatabase (jsonState, email, res) {
    try {
        let result = await bookmark.create(jsonState, email);
        respond(200, res, result);
    } catch (error) {
        respond(500, res, { error: error });
    }
}

function createBookmark (jsonData, req, res) {
    var data = parseJson(jsonData, res),
        jsonState = jsonData,
        email = null;

    // Extract the email if there is one.
    if (data.hasOwnProperty('email')) {
        email = data.email;
        delete data.email;
        jsonState = JSON.stringify(data);
    }

    updateBookmarkDatabase(jsonState, email, res);
}

async function updateColor (jsonData, req, res) {
    let data = parseJson(jsonData, res)
    try {
        let user = await Accounts.findUserByUsername(data.userEmail)
        data.userRole = Roles.getRolesForUser(user._id);
        
        // Request edit of the data server.
        let url = HUB_URL + '/updateColor'
        HTTP.call('POST', url, {data: data}, (error, result) => {
            if (error) {
                respond(500, res, result.data);
            } else {
                respond(200, res, result.data);
            }
        });
    } catch (error) {
        respond(500, res, { error: error });
    }
}

function receivePost (operation, req, res) {
    
    // Receive a query for an operation and process it
    
    passPostChecks(req, res)
    var jsonData = '';
    
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonData += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
        if (operation === 'createBookmark') {
            createBookmark(jsonData, req, res);
        } else if (operation === 'updateColor') {
            updateColor(jsonData, req, res);
        } else {
            respond(500, res,
                {error: 'no handler for this operation: ' + operation});
        }
    });
}

function editMapGet (operation, req, res) {

    // Edit a map on the data server.

    // Find the username.
    let urlParts = req.url.split('/')
    let username = urlParts[urlParts.indexOf('email') + 1]
    
    // Get the user's roles.
    let user = Accounts.findUserByUsername(username)
    let roles = Roles.getRolesForUser(user._id);
    
    let url = HUB_URL + '/' + operation + req.url
    if (roles.length > 0) {
        url += '/role/' + roles.join('+');
    }
    
    // Request edit of the data server.
    HTTP.call('GET', url, (error, result) => {
        if (error) {
            respond(500, res, error);
        } else {
            respond(200, res, result.data);
        }
    });
}

WebApp.connectHandlers.use('/test', function (req, res) {
    respond(200, res, 'just testing');
});

WebApp.connectHandlers.use('/query/createBookmark', function (req, res) {
    receivePost('createBookmark', req, res);
});

// /deleteMap/mapId/unitTest/noNeighbors/email/swat@soe.ucsc.edu
WebApp.connectHandlers.use('/deleteMap', function (req, res) {
    editMapGet('deleteMap', req, res)
});

WebApp.connectHandlers.use('/updateColor', function (req, res) {
    receivePost('updateColor', req, res)
});

HUB_URL = Meteor.settings.public.HUB_URL;
