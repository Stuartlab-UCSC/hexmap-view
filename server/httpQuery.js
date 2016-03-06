
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var url = Meteor.absoluteUrl();

function respond (code, res, msg) {

    // Send a response to the client.
    var data = msg;
    if (code === 200) {
        res.setHeader('Content-Type', 'application/json');
        data = JSON.stringify(msg);
    }
    res.writeHead(code);
    res.end(data + '\n');
}

function overlayNodes(dataIn, res) {

    // Process the data in the request.

    // Validate a specific map and layout for now.
    var map = 'CKCCv1',
        layout = 'mRNA';
    
    // Validate that certain properties are included
    if (!dataIn.hasOwnProperty('map')) {
        respond(400, res, 'Map missing or malformed');
    } else if (!dataIn.hasOwnProperty('layouts')) {
        respond(400, res, 'Layouts missing or malformed');
    } else if (typeof dataIn.layouts !== 'object') {
        respond(400, res, 'Layouts type should be an object')
    
    // Validate a specific map and layout for now.
    } else if (dataIn.map !== map) {
        respond(400, res, 'The only frozen map available is ' + map);
    } else if (!dataIn.layouts.hasOwnProperty(layout)) {
        respond(400, res, 'The only map layout available is ' + layout);
    } else {

        //console.log('dataIn.layouts.hasOwnProperty(layout):', dataIn.layouts.hasOwnProperty(layout));
        // All validations have passed, so process the data
        // TODO for now we pass a fake URL
        dataOut = {bookmark: url + "?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"};
        respond(200, res, dataOut);
    }
}

function passBasicChecks (req, res) {

    // Do some basic checks on the request headers, returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respond(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respond(400, res, 'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    
    // Receive query requests and process them
    // TODO use this to process all queries, not just overlayNodes
    
    if (!passBasicChecks(req, res)) {
        return;
    }
    
    req.setEncoding('utf8');
    var jsonDataIn = '';
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    var queryFx = overlayNodes;
    req.on('end', function () {
    
        // Process the data in the request.
        //console.log('jsonDataIn:', jsonDataIn);
        try {
            var dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respond(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the query-specific function an let it complete the response
        queryFx(dataIn, res);
    });
});

/*
 Test commands
# bad map
curl -X POST -d '{"map": "pancannn"}' -H 'Content-Type:application/json' localhost:3000/query/overlayNodes

# bad map
curl -X POST -d '{"map": "pancannn"}' -H 'Content-Type:application/json' localhost:3000/query/overlayNodes

*/