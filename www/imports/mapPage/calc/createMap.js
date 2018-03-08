// createMap.js
// This creates a new map with user uploaded data.

import ajax from '/imports/mapPage/data/ajax';
import auth from '/imports/common/auth';
import DialogHex from '/imports/common/DialogHex';
import rx from '/imports/common/rx';
import tool from '/imports/mapPage/head/tool';
import userMsg from '/imports/common/userMsg';
import util from '/imports/common/util';
import utils from '/imports/common/utils';

import '/imports/mapPage/calc/createMap.html';

var title = 'Create a Map',
        initial_log = 'log messages',
    dialogHex, // instance of the class DialogHex
    $dialog, // our dialog DOM element
    $dialogCreateButton,
    feature_upload, // the feature upload react component
    feature_data_id, // the data ID to be passed to the computation code
    attribute_upload, // the feature file selector
    attribute_data_id // // the data ID to be passed to the computation code
    ui = new ReactiveDict(),
    log = new ReactiveVar(),
    show_advanced = 'Advanced ...',
    hide_advanced = 'Hide advanced',
    advanced_label = new ReactiveVar();
 
Template.create_map_t.helpers({
    major_project: function () {
        return ui.get('major_project');
    },
    default_attribute: function () {
        return ui.get('default_attribute');
    },
    drl: function () {
        return (!ui.get('tete_method'));
    },
    tete: function () {
        return (ui.get('tete_method'));
    },
    minor_project: function () {
        return ui.get('minor_project');
    },
    dynamic: function () {
        return !(ui.get('precompute_stats'));
    },
    precompute: function () {
        return ui.get('precompute_stats');
    },
    zeroReplace: function () {
        return ui.get('zeroReplace');
    },
    log: function () {
        var text = log.get();
        Meteor.setTimeout(function () {
            var $log = $('#create_map_dialog .log');
            if ($log && $log[0]) {
                $log.scrollTop($log[0].scrollHeight);
            }
        }, 0); // Give some time for the log message to show up
            return text ? text : initial_log;
    },
    advanced_label: function () {
        return ui.get('show_advanced') ?
            hide_advanced : show_advanced;
    },
    advanced_display: function () {
        if (ui.get('show_advanced')) {
            return 'table-row';
        } else {
            return 'none';
        }
    },
});

function log_it (msg_in, startDate, loaded, total, replace_last) {

    var msg = msg_in,
        msgs = log.get();

    if (!msg && startDate) {

        // This must be an upload progress messsage
        var endDate = new Date(),
            elapsed,
            elapsed_str,
            size_str,
            start_str;
        elapsed = Math.ceil((endDate.getTime() -
            startDate.getTime()) / 100 / 60) / 10,
        elapsed_str = elapsed.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
        size_str = total.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
        start_str = loaded.toString().replace(/\B(?=(\d{3})+\b)/g, ",");
        
        msg = 'Uploaded ' + start_str +
            ' of ' + size_str +
            ' bytes in ' + elapsed_str + ' minutes...';
    }
    
    if (replace_last) {

        // We want to replace the last message logged so remove it.
        msgs = msgs.slice(0, msgs.lastIndexOf('\n'));
        log.set(msgs + msg)
    } else {
        log.set(msgs + '\n' + msg);
    }
}

function report_error (result) {

    // Send the error message to the console.
    rx.set('createMap.running.done');
    $dialogCreateButton.removeClass('ui-state-disabled');
    
    // Give the user a data/timestamp so the problem can be tracked down.
    var date = new Date().toString(),
        i = date.indexOf('GMT');
    date = date.slice(0, i);
    
    // Display on the user-visible log.
    var msg = result.error;
    log_it(msg);
    
    // Give an error message.
    userMsg.jobError(result, {
        prefix: 'While creating your map: ',
        link: 'https://tumormap.ucsc.edu/help/createMapTrouble.html',
        linkStr: 'More information.',
    });
}

function getProjectName () {
    return ui.get('major_project') + '/' + ui.get('minor_project') + '/';
}

function getJobStatus (jobId, jobStatusUrl) {

    // Check status of the job and display when complete.
    ajax.getJobStatus(jobId, jobStatusUrl,
        function (job) {
            if (job.status === 'Success') {
                userMsg.jobSuccess(job.result, {
                    prefix: 'Success: map created.',
                    contentClass: ' ',
                });
            } else {
                report_error(job.result);
            }
        },
        report_error
    )
}

function create_map () {

    // Send the create map request to the server.
    
    opts = {
        map: ui.get('major_project') + '/' + ui.get('minor_project'),
        layoutInputDataId: feature_data_id,
        layoutInputName: 'layout',
        outputDirectory: 'view/' + getProjectName(),
        noLayoutIndependentStats: true,
        noLayoutAwareStats: true,
        email: Meteor.user().username,
    }
    if (attribute_data_id) {
        opts.colorAttributeDataId = attribute_data_id
    }
    if (ui.get('zeroReplace')) {
        opts.zeroReplace = ui.get('zeroReplace')
    }
    /* future:
    if (ui.get('display_default').length > 0) {
        opts.firstAttribute = ui.get('display_default')
    }
    if (ui.get('precompute_stats')) {
        opts.noLayoutIndependentStats = false;
        opts.noLayoutAwareStats = false;
    }
    */
    
    if (DEV) {
        console.log('\nCompute request options: ', opts);
    }
    
    ajax.query('createMap', opts,
        function (result) {
            log_it('Map is in the job queue.');
            getJobStatus(result.jobId, result.jobStatusUrl);
        },
        function (error) {
            report_error(error);
        },
    );
    
    userMsg.jobSubmitted();
    hide();
    rx.set('createMap.running.done');
}

function upload_attributes () {

    // Upload the user's attribute file
    if (attribute_upload.refs.fileObj) {
        log_it('Uploading color attributes...\n')
        var startDate = new Date();
        ajax.upload({
            mapId: ui.get('major_project') + '/' + ui.get('minor_project') + '/',
            sourceFile: attribute_upload.refs.fileObj,
            targetFile: attribute_upload.refs.fileObj.name,
            success: function (results, dataId) {
                attribute_data_id = dataId;
                log_it('Color attributes upload complete.')
                create_map();
            },
            error: function (result) {
                log_it(result.error)
                report_error(result)
          },
            progress: function (loaded, total) {
                log_it(null, startDate, loaded, total, true);
            },
        });
    } else {
        create_map();
    }
}

function create_clicked (event) {
    
    // Upload the feature file when the create button is clicked.
    if ($dialogCreateButton.hasClass('ui-state-disabled')) { return; }
    
    if (!util.isValidFileName(ui.get('minor_project'))) {
        userMsg.error('map name may only contain the characters:' +
            ' a-z, A-Z, 0-9, dash (-), dot (.), underscore (_)');
        return;
    }
    
    rx.set('createMap.running.now');

    if (!feature_upload.refs.fileObj) {
        rx.set('createMap.running.done');
        userMsg.error(
            'a layout input file must be selected to create a map.')
        return;
    }
    
    // Show the progress snake and disable the create button.
    $dialogCreateButton.addClass('ui-state-disabled');
    
    log_it('Uploading layout input...\n\n')
    var startDate = new Date();
    ajax.upload({
        mapId: ui.get('major_project') + '/' + ui.get('minor_project') + '/',
        sourceFile: feature_upload.refs.fileObj,
        targetFile: feature_upload.refs.fileObj.name,
        success: function (results, dataId) {
            feature_data_id = dataId;
            log_it('Layout input upload complete.')
            upload_attributes();
        },
        error: function (result) {
            log_it(result.error)
            report_error(result)
         },
        progress: function (loaded, total) {
            log_it(null, startDate, loaded, total, true);
        },
    });
}

function build_dialog_content (username) {

    import React, { Component } from 'react';
    import { render } from 'react-dom';
    import Upload from '/imports/component/Upload.js';

     // Define the file selector for features file
    feature_upload = render(
        <Upload />, $dialog.find('.feature_upload_anchor')[0]);

    // Define the file selector for attributes file
    attribute_upload = render(
        <Upload />, $dialog.find('.attribute_upload_anchor')[0]);

    // Find a name to use for this user's projects that will be
    // safe to use as a directory name. TODO this should be made unique for
    // the corner case of the safe name duplicates another user's safe name.
    ui.set('major_project', util.clean_file_name(username));

    // Initialize some ui values
        log.set(initial_log);
    
    // Remove focus from question marks.
    $('#create_map_dialog .blur').blur();
    
    // Define some event handlers
    $('#create_map_dialog .minor_project').on('change', function (ev) {
         ui.set('minor_project', ev.target.value);
   });
    $('#drl').on('change', function (ev) {
        ui.set('tete_method', ev.target.checked);
    });
    $('#tete').on('change', function (ev) {
        ui.set('tete_method', !ev.target.checked);
    });
    $('#create_map_dialog .default_attribute').on('change', function (ev) {
        ui.set('default_attribute', ev.target.value);
    });
    $('#dynamic').on('change', function (ev) {
        ui.set('precompute_stats', !ev.target.checked);
    });
    $('#precompute').on('change', function (ev) {
        ui.set('precompute_stats', ev.target.checked);
    });

    $('#create_map_dialog .zeroReplace').on('change', function (ev) {
        ui.set('zeroReplace', ev.target.checked);
    });

    // Define event handler for advanced link click
    $('#create_map_dialog .advanced_trigger').on('click', function () {
        ui.set('show_advanced',
            !ui.get('show_advanced'));
    });
    
    $dialogCreateButton = $('.ui-dialog-buttonset span');
}

function show () {

    // Show the contents of the dialog, once per menu button click
    
    // First find the username.
    util.get_username(function (username) {
    
        // User name has been received, set up the widgets.
        if (username) {
            build_dialog_content(username);
        } else {
            rx.set('createMap.running.done');
            userMsg.error('username could not be found');
        }
    });
}

function preShow () {

    // Check for this user having the credentials to do this.
    return auth.credentialCheck('to create a map');
}

function hide() {

    // Clear the filename values.
    $dialog.find('.file_name').val('');
    
    dialogHex.hide();
}

exports.init = function () {
 
    $dialog = $('#create_map_dialog');
    var $button = $('#navBar .createMap');

    // Define the dialog options & create an instance of DialogHex
    var opts = {
        title: title,
        maxHeight: $(window).height() - 30,
        buttons: [{ text: 'Create', click: create_clicked }],
    };
    dialogHex = DialogHex.create({
        $el: $dialog,
        opts: opts,
        preShowFx: preShow,
        showFx: show,
        hideFx: hide,
        helpAnchor: '/help/createMap.html'
    });

    // Initialize some UI variables
    ui.set('tete_method', false);
    ui.set('display_default', '');
    ui.set('minor_project', 'map');
    ui.set('precompute_stats', false);
    ui.set('zeroReplace', false);
    ui.set('show_advanced', false);

    // Listen for the menu clicked
    tool.add("createMap", function() {
        dialogHex.show();
    }, 'Create a new map');
    
    // Also open the dialog if the home page thumbnail-like is clicked
    $('.createMapHome .createMap')
        .button()
        .on('click', function () {
        $button.click();
    });
}
