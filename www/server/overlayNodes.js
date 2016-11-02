
// overlayNodes.js
// Handle overlayNode requests from the client or query API

var Future = Npm.require('fibers/future');

var url = Meteor.absoluteUrl();

function passOverlayNodeChecks (dataIn, res) {

    // Do some checks on the overlayNodes request content, returning false if
    // not passing.
    
    // TODO Validate a specific map and layout for now.
    // Eventually we will want to check for any maps we have deemed frozen
    var map = 'CKCC/v1',
        layout = 'mRNA';
    
    // Validate that certain properties are included
    if (!dataIn.hasOwnProperty('map')) {
    
        // TODO should we require authentication and use:
        //  throw new Meteor.Error(403, "Access denied")

        Http.respond(400, res, 'Map missing or malformed');
        return false;

    } else if (!dataIn.hasOwnProperty('layout')) {
        Http.respond(400, res, 'Layout missing or malformed');
        return false;

    } else if (!dataIn.hasOwnProperty('nodes')) {
        Http.respond(400, res, 'Nodes missing or malformed');
        return false;

    } else if (typeof dataIn.nodes !== 'object') {
        Http.respond(400, res, 'Nodes type should be an object')
        return false;

    // Validate a specific map and layout for now.
    } else if (dataIn.map !== map) {
        Http.respond(400, res, 'The only frozen map available is ' + map);
        return false;
        
    } else if (dataIn.layout !== layout) {
        Http.respond(400, res, 'The only map layout available is ' + layout);
        return false;
    }
        
    return true;
}
    
saveBookmark = function(state) {

    // TODO replace this with a hash of the state so the same state may reuse an
    // existing bookmark of the same state
    var crypto = Npm.require('crypto');
    var id = crypto.randomBytes(4).readUInt32LE(0).toString();
    
    // TODO put this into dbMethods.js
    var Fiber = Npm.require('fibers');
    var f = Fiber(function(id) {
        Bookmarks.insert({
            "_id": id,
            "jsonState": state,
            "createdAt": new Date(),
        });
    }).run(id);
    return id
}

overlayNodes = function (dataIn, res, future) {
    
    // Process the data in the overlayNodes request where dataIn is the
    // request data as a javascript object.
    // res is supplied if an outside caller made this query
    // future is supplied if the query came from our meteor client
    
    // Set up some static options for the python call
    var opts = {
        neighborhood_size: 6,
        num_jobs: 0,
        pivot_data: dataIn,
    };
    
    var file;

    // TODO test cases should not be in production code
    if (dataIn.TESTpythonCallStub
        || dataIn.TESTpythonCallGoodData
        || dataIn.TESTpythonCallGoodDataBookmark) {

        // Point to the test metadata file
        opts.in_meta = TEST_DATA_DIR + 'overlayNodesMeta.json';
        
    } else {
    
        // Load the metadata into the parms to be passed.
        file = LAYOUT_INPUT_DIR + dataIn.map + '/' + 'meta.json';
        opts.meta = readFromJsonFileSync(file);
        
        // Prepend the absolute path for xy positions to the base file name in
        // the metadata.
        file = VIEW_DIR + dataIn.map + '/'
            + opts.meta.layouts[dataIn.layout].postSquiggleFile;
        
        // Save the full path name for xy positions in the metadata,
        // just in case it is wanted.
        opts.meta.layouts[dataIn.layout].postSquiggleFile = file;

        // Load the xy positions data into the parms to be passed.
        var parsed = readFromTsvFileSync(file);
        var pos = {};
        _.each(parsed, function (line, i) {
            pos[line[0]] = {};
            pos[line[0]].x = parseFloat(line[1]);
            pos[line[0]].y = parseFloat(line[2]);
        });
        opts.positions = pos;

        // Save the feature space file name in the parms in the metadata. This
        // file is too big to put it's data in the parms, so the python code
        // will read from the file directly for now.
        opts.meta.layouts[dataIn.layout].featureSpaceFile = Path.join(
            FEATURE_SPACE_DIR,
            dataIn.map + '/'
            + opts.meta.layouts[dataIn.layout].featureSpaceFile);
    }
    
    // Set the log file name
    opts.log = TEMP_DIR + 'overlayNodes.log';
    
    // Save the future for responding to client callers.
    if (future) { opts.future = future; }
    
    if (res) {
        console.log('!!!!!!! overlayNodes() called with a res');
    }
    if (future) {
        console.log('!!!!!!! overlayNodes() called with a res');
    }
    
    PythonCall.call('compute_pivot_vs_background', opts, function (result) {
    
        var future = opts.future;
        
        if (res) {
            console.log('!!!!!!! overlayNodes():callPython called with a res');
        }
        if (future) {
            console.log('!!!!!!! overlayNodes():callPython called with a future');
        }
    
        if (result.code !== 0) {
            Http.respond(500, res, result.data, future);
            return;
        }
        
        var dataIn = opts.pivot_data,
            data = result.data;
        
        if (dataIn.TESTpythonCallStub || dataIn.TESTpythonCallGoodData) {
            Http.respond(result.code === 0 ? 200 : 500, res, data, future);
            return;
        }
        
        // Build the URLs and send them to the http caller.
        var emailUrls = {};
        var urls = [];
        _.each(data, function (node, nodeName) {
            // TODO URL-encode the node ID.
            // A problem already encountered is '#' terminates the query string.
            // Does this mean we should URL-decode any query strings we receive?
            var url = URL_BASE + '/?'
                + '&p=' + dataIn.map.replace('/', '.')
                + '&node=' + nodeName
                + '&x=' + node.x
                + '&y=' + node.y;
            emailUrls[nodeName] = url;
            urls.push(url);
        });
        Http.respond(200, res, {bookmarks: urls}, future);
        
        // Send email to interested parties
        var subject = 'tumor map results: ',
            msg = 'Tumor Map results are ready to view at:\n\n';
        
        _.each(emailUrls, function (node, nodeName) {
            msg += nodeName + ' : ' + node + '\n';
            subject += node + '  ';
        });
            
        if ('email' in dataIn) {
            sendMail(dataIn.email, subject, msg);
            msg += '\nAlso sent to: ' + dataIn.email;
        } else {
            msg += '\nNo emails included in request';
        }
        sendMail(ADMIN_EMAIL, subject, msg);

        /* TODO bookmarks for later
        var state = {
            page: 'mapPage',
            project: xyData.map + '/',
            current_layout_name: xyData.layout,
            overlayNodes: xyData.nodes,
        };
        var bookmark = saveBookmark(state);
        Http.respond(200, res, {bookmark: url + '?b=' + bookmark}, future);
        */
    });
}

overlayNodesQuery = function (dataIn, res) {

    // Let the validator send the response on invalid data.
    if (!passOverlayNodeChecks(dataIn, res)) return;
    
    // TODO test cases should not be in production code
    if (dataIn.TESTbookmarkStub) {

        // Return this fake URL for this test
        Http.respond(200, res, {bookmark: url +
            "?b=18XFlfJG8ijJUVP_CYIbA3qhvCw5pADF651XTi8haPnE"});
        return;
    }
    
    overlayNodes(dataIn, res);
}

Meteor.methods({

    // For calling from the client
    overlayNode: function (opts) {
        this.unblock();
        var future = new Future();
        overlayNodes(opts, undefined, future);
        return future.wait();
    },
});
