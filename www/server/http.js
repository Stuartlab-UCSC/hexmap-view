
// http.js
// Handle incoming HTTP requests, and outgoing HTTP requests to other servers.
// We only support POST requests for incoming and outgoing.
//
// Outgoing HTTP Requests:
//
// The request and response bodies contain a json-formatted file name on a
// volume that is shared between the local server and remote calc server. This
// prevents reading and writing the files twice and reduces the size of the
// HTTP content.
//
// The file referenced in the request body contains the list of parameters to
// be passed to the remote pythonCall.py which then reads and translates the
// file contents from json to a python dict.
//
// The file referenced in the response body contains the results of the
// of the remote server calculation which is read and translated from json to
// a javascript object by the local pythonCall.js.
//
// TODO do we want the user to be able to cancel the calc ?

function passPostChecks (req, res) {

    // Do some basic checks on the request headers,
    // returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        respondToHttp(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        respondToHttp(400, res,
            'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

// A look-up table indexed by url and referencing the parameter checker function
var parm_checkers = {
   '/calc/layout': create_map_http_parm_checker,
   //'/query/overlayNodes': overlay_node_http_parm_checker,
};

function receive (url, req, res) {
    
    // Receive http post requests and process them
    
    var json_data = '';
    
    if (!passPostChecks(req, res)) { return; }
    
    req.setEncoding('utf8');
    
    // Continue to receive chunks of this request
    req.on('data', function (chunk) {
        json_data += chunk;
    });
    
    // Process the data in this request
    req.on('end', function () {
    
        if (CALC_URL) {
        
            // TODO this would handle the overlayNode web API
        } else {
                   
            // Convert the json to javascript.
            var data_or_file;
            try {
                data_or_file = JSON.parse(json_data);
            } catch (error) {
                respondToHttp(400, res, 'Malformed JSON data given');
                return;
            }
            var data;

            if (typeof data_or_file === 'string') {
           
                // With just a string sent, we assume this is a file name
                // containing the parameters, so extract those parameters
                try {
                    data = readFromJsonFileSync(data_or_file);
                } catch (error) {
                    respondToHttp(400, res, 'Malformed JSON data given');
                    return;
                }
            } else {
           
                // The data is not a string, so assume it is the array of
                // parameters.
                data = data_or_file;
            }

            // Let this validator send the http response on invalid data.
            if (parm_checkers[url]) {
                parm_checkers[url] (data, res);
            }
        }
    });
}

WebApp.connectHandlers.use('/calc/layout', function (req, res, next) {
    receive('/calc/layout', req, res, next);
});

WebApp.connectHandlers.use('/query/overlayNodes', function (req, res, next) {
    receive('/query/overlayNodes', req, res, next);
});

respondToHttp = function (code, res, data_in) {

    // This responds to an http request after converting data to json.
    // TODO authenticate request for known users ?
    var data = JSON.stringify(data_in);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(code);
    res.end(data + '\n');
};
