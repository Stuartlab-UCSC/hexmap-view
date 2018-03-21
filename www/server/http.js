
// http.js
// Handle incoming HTTP requests.

import bookmark from './bookmark';

function respond (statusCode, res, data_in) {

    // This responds to an http request after converting data to json.
    // TODO authenticate request for known users ?
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
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respond(400, res,
            'Only content-type of application/json is understood here');
        return false;
    }
    return true;
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
    var data,
        jsonState = jsonData,
        email = null;
    
    // Validate the json.
    try {
        data = JSON.parse(jsonData);
    } catch (e) {
        var msg = 'server error decoding JSON: ' + e;
        console.log(msg + ', JSON string:' + jsonData);
        respond(500, res, {error: msg });
        return;
    }

    // Extract the email if there is one.
    if (data.hasOwnProperty('email')) {
        email = data.email;
        delete data.email;
        jsonState = JSON.stringify(data);
    }

    updateBookmarkDatabase(jsonState, email, res);
}

function receiveQuery (operation, req, res) {

    // Receive a query for an operation and process it
    
    if (!passPostChecks(req, res)) { return; }
    
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
        } else {
            respond(500, res,
                {error: 'no handler for this query operation: ' + operation});
        }
    });
}

WebApp.connectHandlers.use('/test', function (req, res) {
    respond(200, res, 'just testing');
});

WebApp.connectHandlers.use('/query/createBookmark', function (req, res, next) {
    receiveQuery('createBookmark', req, res, next);
});
