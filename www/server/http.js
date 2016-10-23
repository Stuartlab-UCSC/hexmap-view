
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

var CreateMap = require('./createMap');
var MapManager = require('./mapManager');
var PythonCall = require('./pythonCall');
var Http = require('./http');

exports.respond = function (code, res, data_in, in_json) {

    // This responds to an http request after converting data to json.
    // TODO authenticate request for known users ?
    var data;
    if (in_json) {
    
        // The data is already in json format
        data = data_in;
    } else {
    
        // Convert the data to json format
        data = JSON.stringify(data_in);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(code);
    res.end(data + '\n');
};

function passPostChecks (req, res) {

    // Do some basic checks on the request headers,
    // returning false if not passing.

    // Only POST methods are understood
    if (req.method !== 'POST') {
        Http.respond(405, res, 'Only the POST method is understood here');
        return false;
    }
    
    // Only json content type is understood
    if (req.headers['content-type'] !== 'application/json') {
        Http.respond(400, res,
            'Only content-type of application/json is understood here');
        return false;
    }

    return true;
}

// A look-up table indexed by call_name and referencing the feature http handler
var pre_calc = {
    //
};

// A look-up table indexed by call_name and referencing the feature post-calc
// function, if there is one, that will be executed on the local/remote? server.
var post_calc = {
    layout: CreateMap.post_calc,
    reflection: MapManager.reflection_post_calc,
};

function process_local_python_call (json_data, res, call_name) {

    // Process a local python call

    // The json_data may be:
    //   - a filename that contains parameters for a calc call
    //   - parameters for a calc call
       
    // Convert the json to javascript.
    var data_or_file;
    try {
        data_or_file = JSON.parse(json_data);
    } catch (error) {
        Http.respond(400, res, 'Malformed JSON data given');
        return;
    }
   
    var data;
    if (data_or_file.parm_filename) {
   
        // If a parm_filename exists in the data, this is a file
        // containing the parameters, so extract those parameters
        try {
            data = readFromJsonFileSync(data_or_file.parm_filename);
        } catch (error) {
            Http.respond(400, res, 'Malformed JSON data given in file');
            return;
        }
    } else {
   
        // The data does not have parm_filename, so assume it is the
        // parameters.
        data = data_or_file;
    }
    
    // If there is an http handler for this calc call, call it.
    if (pre_calc[call_name] && !pre_calc[call_name] (data, res)) {
        return;
    }
    
    // Save the post_calc_handler if there is one
    var context = { http_response: res };
    if (post_calc[call_name]) {
        context.post_calc = post_calc[call_name];
    }

    // Call the python function,
    // letting one of its callees send the http response.
    PythonCall.call(call_name, data, context);
}

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
    
        var call_name = url.slice(url.lastIndexOf('/') + 1);
        
        // We assume anything received is a python call request for now
        if (CALC_URL) {
        
            // Pass the json data as is to the remote python caller
            PythonCall.call(call_name, json_data, { http_response: res }, true);

        } else {
            process_local_python_call(json_data, res, call_name);
        }
    });
}

WebApp.connectHandlers.use('/calc/layout', function (req, res, next) {
    receive('/calc/layout', req, res, next);
});

WebApp.connectHandlers.use('/calc/reflection', function (req, res, next) {
    receive('/calc/reflection', req, res, next);
});

WebApp.connectHandlers.use('/calc/statsDynamic', function (req, res, next) {
    receive('/calc/statsDynamic', req, res, next);
});

WebApp.connectHandlers.use('/query/overlayNodes', function (req, res, next) {
    receive('/query/overlayNodes', req, res, next);
});
