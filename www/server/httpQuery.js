
// httpQuery.js
// Receive and respond to incoming HTTP requests according to the query API

var Future = Npm.require('fibers/future');
var exec = Future.wrap(Npm.require('child_process').exec);
// TODO use spawn instead of exec

var url = Meteor.absoluteUrl();

function passHttpChecks (req, res) {

    // Do some basic checks on the request headers, returning false if not passing.
    //console.log("passHttpCheck got req:",req);
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

//will grab any requeests with the first argument in it (string)
//query/attributes
WebApp.connectHandlers.use("/query/overlayNodes", function(req, res, next) {
    //req is http request coming in // res is response going out
    // Receive query requests and process them
    
    // TODO make this generic so it works with more than overlayNodes.
    
    if (!passHttpChecks(req, res)) {
        return;
    }
    
    var queryFx = overlayNodesQuery;
   //do everything same until here
    var jsonDataIn = '';
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    // look at HTTP protocol , http.get(), only accepting http.post()
    //tells it when data comes across,
    req.on('data', function (chunk) {
        jsonDataIn += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
    
        try { //this is were you pull json data from
            var dataIn = JSON.parse(jsonDataIn);
        } catch (error) {
            respondToHttp(400, res, 'Malformed JSON data given');
            return;
        }
        
        // Call the query-specific function and let it complete the response
        queryFx(dataIn, res);
    });
});

var practiceDoc = [
        {
        q: 'a'
        },
        {
        q: 'b'
        },
        {
        q: 'c'
        },
        {
        q: 'd'
        }
    ];

//will grab any requeests with the first argument in it (string)
//query/attributes
WebApp.connectHandlers.use("/query/attributes", function(req, res, next) {
    //req is http request coming in // res is response going out
    // Receive query requests and process them

    // TODO make this generic so it works with more than overlayNodes.
    //console.log(passHttpChecks(req,res));

    //if (!passHttpChecks(req, res)) {
    //    return;
    //}

    //do everything same until here
    var jsonDataIn = '';
    req.setEncoding('utf8');

    console.log("req URL:",req.url);
    console.log("----------------------------------------------------------------------------")
    //console.log(req);
    // Continue to receive chunks of this request
    // look at HTTP protocol , http.get(), only accepting http.post()
    //tells it when data comes across,
    req.on('data', function (chunk) {
        console.log("req.on 'data pinged");
        jsonDataIn += chunk;
    });

    // Process the data in this request
    req.on('end', function () {
        console.log("req.on 'end' pinged");
        try { //this is were you pull json data from
            var dataIn = practiceDoc;//JSON.parse(jsonDataIn);
        } catch (error) {
            console.log("error in parsing caugt")
            respondToHttp(400, res, 'Malformed JSON data given');
            return;
        }
        console.log(dataIn);
        //respondToHttp(200, {"arr":[1,2,3]}, "responded");

        // Call the query-specific function and let it complete the response
        //queryFx(dataIn, res);
        //console.log(dataIn);
    });
});
respondToHttp = function (code, res, msg, future) {

    // This responds to an http request or handles a future for those cases
    // where our client is making the request, rather than an outsider using
    // the query API.

    if (res) {
    
        // Send an HTTP response to an outsider using the query API.
        var data = msg;
        if (code === 200) {
            res.setHeader('Content-Type', 'application/json');
            data = JSON.stringify(msg);
        }
        res.writeHead(code);
        res.end(data + '\n');

    } else if (future) {
    
        // Return the message to our client.
        if (code === 200) {
            future.return(msg);
        } else {
            future.throw(msg);
        }
    }
}
