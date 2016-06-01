
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var Future = Npm.require('fibers/future');
var exec = Future.wrap(Npm.require('child_process').exec);
// TODO use spawn instead of exec and do we need Future here?

var url = Meteor.absoluteUrl();

function passHttpChecks (req, res) {

    // Do some basic checks on the request headers, returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respondToHttp(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respondToHttp(400, res, 'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    
    // Receive query requests and process them
    
    // TODO make this generic so it works with more than overlayNodes.
    
    if (!passHttpChecks(req, res)) {
        return;
    }
    
    var queryFx = overlayNodes;
    var jsonDataIn = '';
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
    
        try {
            var dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respondToHttp(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the query-specific function and let it complete the response
        queryFx(dataIn, res);
    });
});

sendMail = function (users, subject, msg) {

    // Send mail to user(s) with the given subject and message.
    
    // Don't send from localhost, macOS mail doesn't support the 'from' option.
    if (URL_BASE.indexOf('localhost') > -1) return;
    
    var command =
        'echo "'
        + msg
        + '" | '
        + 'mail -s "'
        + subject
        + '" -S from="hexmap@ucsc.edu" '
        + users.toString();
    
    exec(command, function (error, stdout, stderr) {
        if (error) {
            console.log('sendMail had an error:', error);
        }
    });
}

respondToHttp = function (code, res, msg) {

    // Send a response to the client.
    var data = msg;
    if (code === 200) {
        res.setHeader('Content-Type', 'application/json');
        data = JSON.stringify(msg);
    }
    res.writeHead(code);
    res.end(data + '\n');
}
