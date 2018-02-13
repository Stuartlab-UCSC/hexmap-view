
// http.js
// Handle incoming HTTP requests.

var bookmark = require('./bookmark');

exports.respond = function (statusCode, res, data_in) {

    // This responds to an http request after converting data to json.
    // TODO authenticate request for known users ?
    var data = JSON.stringify(data_in);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(data + '\n');
};

function passPostChecks (req, res) {

    // Do some basic checks on the request headers,
    // returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        exports.respond(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        exports.respond(400, res,
            'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

function receiveQuery (operation, req, res) {

    // Receive a query for an operation and process it
    
    var json_data = '';
    
    if (!passPostChecks(req, res)) { return; }
    
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        json_data += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
        console.log('received query:', operation);

        if (operation === 'createBookmark') {
            try {
                data = JSON.parse(json_data);
            } catch (e) {
                msg = 'server error decoding JSON: ' + e;
                console.log(msg + ', JSON string:' + json_data);
                exports.respond(500, res, {error: msg });
                return;
            }
           
            // Create the bookmark, letting it return the http response
            bookmarke.createBookmarkFiber(json_data, res)
        } else {
            exports.respond(500, res,
                {error: 'no handler for this query operation: ' + operation});
        }
    });
}

WebApp.connectHandlers.use('/test', function (req, res, next) {
    exports.respond(200, res, 'just testing');
});

WebApp.connectHandlers.use('/query/createBookmark', function (req, res, next) {
    receiveQuery('createBookmark', req, res, next);
});
