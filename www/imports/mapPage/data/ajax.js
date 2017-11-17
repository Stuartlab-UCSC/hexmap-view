/**
 * Talk to the data/compute server.
 */

import util from '/imports/common/util.js';

var UPLOAD_MAX_GIGABYTES = 4,
    UPLOAD_MAX_BYTES = 1024 * 1024 * 1024 * UPLOAD_MAX_GIGABYTES,
    retryLimit = 3;

function log (url, code, userMsg) {
    console.log('ajax error on:', url, '\n    ', code + ':', userMsg);
}

function getData(url, successFx, errorFx, ok404, parse) {

    // Retrieve view data for the current project.
    // For the case where 404 not found is OK we handle the 404 in the success
    // block as well as the error block. This is because our current data
    // server knows how to handle these and returns the 404 as success.
    // However, in the future we may have a data server we don't have much
    // control over, so we also handle this in the error block.
    function handle404 (url, successFx, errorFx, ok404, parse) {
    
        // Handle the cases where 404 not found is OK.
        
        var id = url.slice(url.lastIndexOf('/') + 1);
    
        if (id === 'layouts.tab') {
        
            // Special handling for 'layouts', whose ID is
            // 'matrixnames' in older maps. Get again with the new ID.
            url = url.slice(0, url.lastIndexOf('/') + 1) + 'matrixnames.tab';
            var i = url.indexOf('Ok404');
            url = url.slice(0, i) + url.slice(i+5);
            getData(url, successFx, errorFx, false, parse);
   
        } else {
            // The success handler of the caller should handle 404s.
            successFx('404');
        }
    }
    
    $.ajax({
        type: 'GET',
        url: url,
        tryCount : 0,
        retryLimit : retryLimit,

        success:  function (result) {
        
            //console.log('\nurl result', url, result);
           
            if (result === '404' && ok404) {
                handle404(url, successFx, errorFx, ok404, parse);
                return;
            } else if (parse === 'noParse') {
           
                // Return raw data
                successFx(result);
            } else if (parse === 'tsv') {
           
                // Return tsv-parsed data
                successFx(util.parseTsv(result));
            } else {
           
                // Return json-parsed data
                successFx(JSON.parse(result));
            }
        },
        error: function (error) {
            var msg,
                msg404 = ' GET ' + url + ' 404 (NOT FOUND) is OK here.';
           
            // Special handling where the caller has said a 404 is OK.
            if (error.status.toString() === '404' && ok404) {
                console.log(msg404);
                handle404(url, successFx, errorFx, ok404, parse);
           
            // Handle the usual case.
            } else {
                if (error.statusText) {
                    msg = error.statusText;
                } else if (error.responseJSON) {
                    if (error.responseJSON.error) {
                        msg = error.responseJSON.error;
                    } else {
                        msg = error.responseJSON;
                    }
                } else {
                    msg = 'Unknown error retrieving ' + url;
                }
                log(url, error.status, msg);
                if (errorFx) {
                    errorFx(msg);
                }
            }
        }
    });
}
    
exports.query = function (operation, opts, successFx, errorFx) {
    /*
     * query the compute server with an operation.
     * @param operation: the operation to perform
     * @param opts:      the options to pass to the operation
     * @param successFx: the success callback
     * @param errorFx:   the error callback
     * @return success: the raw or parsed data via the success callback
     *         error:   the error message via the error callback,
     *                  optional
     */
    var url = HUB_URL + '/query/' + operation;
    $.ajax({
        type: 'POST',
        url: url,
        tryCount : 0,
        retryLimit : retryLimit,
        contentType: "application/json", // sending json
        // TODO: from the jquery docs:
        // Note: For cross-domain requests, setting the content type to
        // anything other than application/x-www-form-urlencoded,
        // multipart/form-data, or text/plain will trigger the browser to send
        // a preflight OPTIONS request to the server.
        dataType: 'json', // expects json returned
        data: JSON.stringify(opts),
        success: successFx,
        error: function (error) {
            var msg = 'unknown server error';
            try {
                if (error.responseText.length > 0) {
                    msg = JSON.parse(error.responseText).error;
                }
            } catch (e) {
                msg = 'unknown server error';
           
                // Sometimes the conversion from json causes an exception,
                // so capture what we can here to debug on client
                console.log('ajax error.responseText: ', error.responseText);
                console.log('ajax json error: ', e);
                console.log('ajax error: ', error);
                console.log('ajax error msg: ', msg);
            }
            log(url, error.status, msg);
            if (errorFx) {
                errorFx(msg);
            }
        },
    });

};

exports.upload = function(opts) {
    /*
     * Upload a file to the featureSpace directory for this map.
     *
     * @param opts.mapId      the future mapId of this data
     * @param opts.sourceFile the file object of the file to upload
     * @param opts.targetFile the base file name of the file to save
     * @param opts.success    the function to call upon success
     * @param opts.error      the function to call upon error, optional
     * @param opts.progress   the function to call upon progress update,
     *                        called with bytes loaded and bytes total,
     *                        optional
     *
     * @return success: the raw or parsed data via the success callback
     *         error:   the error message via the error callback,
     *                  if supplied
     */
    var fd = new FormData();
    fd.append('file', opts.sourceFile);

    if (opts.sourceFile.size > UPLOAD_MAX_BYTES) {
        Session.set('mapSnake', false);
        var msg = 'upload failed because file is larger than the ' +
            UPLOAD_MAX_GIGABYTES + ' GB limit.';
        util.banner('error', msg);
        if (opts.error) {
            opts.error(msg);
        }
        return;
    }

    var dataId = 'featureSpace/' + opts.mapId + opts.targetFile;
    var url = HUB_URL + '/upload/' + dataId;

    $.ajax({
        url: url,
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        tryCount : 0,
        retryLimit : retryLimit,
        success: function (result) {
            opts.success(result, dataId);
        },
        error: function (error) {
            var msg = 'Uploading ' + opts.sourceFile +
                ' to server failed with: ' + error;
            log(url, error.status, msg);
            util.banner('error', msg);
            if (opts.error) {
                opts.error(msg);
            }
        },

        // Custom XMLHttpRequest
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                // For handling the progress of the upload
                myXhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        opts.progress(e.loaded, e.total);
                    }
                } , false);
            }
            return myXhr;
        },
    });
};

exports.get = function(opts) {
    /*
     * Retrieve view data for the current project.
     *
     * @param opts.id      the unique data ID relative to the project
     * @param opts.success the function to call upon success
     * @param opts.error   the function to call upon error
     * @param ok404        true: a 404: not found error is OK for this 
     *                           data so call success with '404',
     *                     false: treat 404 as an error as usual;
     *                     optional, defaults to false
     * @param opts.raw  true: do not parse the data returned
     *                    false: parse the data returned,
     *                    optional, defaults to false
     * @return success: the raw or parsed data via the success callback
     *         error:   the error message via the error callback,
     *                  if supplied
     */
    var mapPath = ctx.project;

    // For project metadata, the path only includes the project segment
    // and does not contain the map segment. If this is a simple map
    // name, the project segment is the map segment.
    if (opts.id === 'meta') {
        var first = mapPath.indexOf('/'),
            second = mapPath.indexOf(first + 1);
        if (second > 1) {
            
            // This map id contains a major and minor directory,
            // so extract the major directory
            mapPath = mapPath.slice(0, first + 1);
        }
    }

    // Attach the appropriate file extension and set the parser format.
    // Metadata is in json and all others are assumed to be tsv format.
    var parse;
    if (opts.raw) {
        opts.id += '.tab';
        parse = 'noParse';
    } else if (opts.id === 'meta' || opts.id === 'mapMeta') {
        opts.id += '.json';
        parse = 'json';
    } else {
        opts.id += '.tab';
        parse = 'tsv';
    }

    //getData(HUB_URL + '/data/view/' + mapPath + opts.id +
    getData(
        HUB_URL + (opts.ok404 ? '/dataOk404/view/' : '/data/view/') +
            mapPath + opts.id,
        opts.success,
        opts.error,
        opts.ok404,
        parse
    );
};

