/**
 * Talk to the data/compute server.
 */

import rx from '/imports/common/rx';
import userMsg from '/imports/common/userMsg';
import util from '/imports/common/util';

var UPLOAD_MAX_GIGABYTES = 4,
    UPLOAD_MAX_BYTES = 1024 * 1024 * 1024 * UPLOAD_MAX_GIGABYTES,
    retryLimit = 3,
    jobStatusPollInterval = 1, // second
    job = [];

function log (url, httpCode, norm) {
    console.log('ajax error on url:', url,
        '\n  code:', httpCode,
        '\n  error:', norm.error,
        '\n  stacktrace:', norm.stackTrace);
}

function normalizeErrorResponse (error, url) {
    
    // Standardize the error returned to the caller.
    var norm = {};

    if (error.responseJSON) {
        norm = error.responseJSON;
    } else if (error.responseText) {
        norm.error = error.responseText;
    } else if (error.statusText) {
        norm.error = error.statusText;
    } else {
        norm.error = 'Unknown error';
    }

    log(url, error.status, norm);

    return norm;
}

function getData (url, successFx, errorFx, ok404, parse) {

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
        error: function (errorIn) {
            var msg404 = ' GET ' + url + ' 404 (NOT FOUND) is OK here.',
                error = normalizeErrorResponse(errorIn, url);
           
            // Special handling where the caller has said a 404 is OK.
            if (ok404 && errorIn && 'status' in errorIn &&
                errorIn.status.toString() === '404') {
                console.log(msg404);
                handle404(url, successFx, errorFx, ok404, parse);
           
            // Handle the usual case.
            } else {
                if (errorFx) {
                    errorFx(error);
                }
            }
        }
    });
}

exports.getUserMapAuthorization = function (successFx, errorFx) {

    // Ask the data server if this user is authorized to view the current map.
    var user = Meteor.user(),
        url = HUB_URL + '/mapAuth/mapId/' + ctx.project;
    
    // If there is a signed in user, get the email and roles.
    if (user) {
        url += 'email/' + user.username;
        var roles = rx.get('user.roles');
        if (roles.length > 0) {
            url += '/role/' + roles.join('+');
        }
    }
    $.ajax({
        type: 'GET',
        url: url,
        tryCount : 0,
        retryLimit : retryLimit,
        success: successFx,
        error: errorFx,
    });
};

exports.getProjectList = function (successFx, errorFx) {

    // Ask the data server if this user is authorized to view the current map.
    // @app.route('/projectList/email/<string:userEmail>/roles/<string:userRoles>',

    var user = Meteor.user(),
        url = HUB_URL + '/mapList';
    
    // If there is a signed in user, get the email and roles.
    if (user) {
        url += '/email/' + user.username;
        var roles = rx.get('user.roles');
        if (roles.length > 0) {
            url += '/role/' + roles.join('+');
        }
    }
    $.ajax({
        type: 'GET',
        url: url,
        tryCount : 0,
        retryLimit : retryLimit,
        success: successFx,
        error: errorFx,
    });
};

exports.getJobStatus = function (jobId, jobStatusUrl, successFx, errorFx) {
    
    // Get a job's status. Job completion statuses are 'success' and 'error'.
    // If there is a job completion status or the job is not found, call the
    // provided successFx or errorFx.
    // For other status values, continue to poll the status until a completion
    // status is returned or an error occurs.
    
    function jobDone () {
    
        // Remove the completed job from the jobs list.
        var index = job.indexOf(jobId);
        if (index !== -1) {
            job.splice(index, 1);
        }
    }
    
    function getStatus () {
    
        // If the job is still in the running...
        if (job.indexOf(jobId) > -1) {
        
            // Ask the server for the status.
            var url = jobStatusUrl;
            $.ajax({
                type: 'GET',
                url: url,
                tryCount : 0,
                retryLimit : retryLimit,
                success: function (result) {
                    if (result.status === 'Success' ||
                        result.status === 'Error') {
                        jobDone();
                        successFx(result);
                    } else {
        
                        // Keep polling.
                        setTimeout(getStatus, jobStatusPollInterval * 1000);
                    }
                },
                error: function (error) {
                    jobDone();
                    errorFx(normalizeErrorResponse(error, url));
                },
            });
        }
    }
    
    // Add the job to the outstanding jobs list.
    job.push(jobId);
    
    // Make the first status request.
    getStatus();
};
    
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
        dataType: 'json', // expects json returned
        data: JSON.stringify(opts),
        success: successFx,
        error: function (errorIn) {
            var error = normalizeErrorResponse(errorIn, url);
            if (errorFx) {
                errorFx(error);
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
        var msg = 'upload failed because file is larger than the ' +
            UPLOAD_MAX_GIGABYTES + ' GB limit.';
        userMsg.error(msg);
        if (opts.error) {
            opts.error(msg);
        }
        return;
    }
    rx.set('uploading.now');

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
            rx.set('uploading.done');
        },
        error: function (errorIn) {
            var error = normalizeErrorResponse(errorIn, url);
            error.error = 'Uploading ' + opts.sourceFile.name +
                ' failed with: ' + error.error;
            if (opts.error) {
                opts.error(error);
            }
            rx.set('uploading.done');
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

    getData(
        HUB_URL + (opts.ok404 ? '/dataOk404/view/' : '/data/view/') +
            mapPath + opts.id,
        opts.success,
        opts.error,
        opts.ok404,
        parse
    );
};

