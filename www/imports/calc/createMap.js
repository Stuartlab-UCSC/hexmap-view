// createMap.js
// This creates a new map with user uploaded data.

import Ajax from '/imports/app/ajax.js';
import DialogHex from '/imports/leg/dialogHex.js';
import Tool from '/imports/leg/tool.js';
import Util from '/imports/leg/util.js';
import Utils from '/imports/app/utils.js';

import './htmlCss/createMap.html';

var title = 'Create a Map',
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
    formats = [
        ['clusterData', 'Feature data'],
        ['fullSimilarity', 'Full similarity matrix'],
        ['sparseSimilarity', 'Sparse similarity matrix'],
        ['xyPositions', 'XY positions'],
    ],
    default_feature_format = 'clusterData',
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
        return text;
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

    if (!msg) {

        // This must be an upload progress messsage
        var endDate = new Date(),
            elapsed =
                Math.ceil((endDate.getTime() -
                startDate.getTime()) / 100 / 60) / 10,
            elapsed_str
                = elapsed.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
            size_str
                = total.toString().replace(/\B(?=(\d{3})+\b)/g, ","),
            start_str
                = loaded.toString().replace(/\B(?=(\d{3})+\b)/g, ",");
        msg = 'Uploaded ' + start_str +
            ' of ' + size_str +
            ' bytes in ' + elapsed_str + ' minutes...';
    }
    
    if (replace_last) {

        // We want to replace the last message logged so remove it.
        msgs = msgs.slice(0, msgs.lastIndexOf('\n'));
    }

    if (msgs.length > 1) {
        msg = '\n' + msg;
    }
    log.set(msgs + msg);
}

function report_error (msg) {

    // Send the error message to the console.
    console.log(msg);

    // Make a message to display to the user in case they have pop-ups
    // disabled.
    var banner_msg = "Unable to create map due to an internal error. \n" +
        "A troubleshooting page will open in a new tab.";

    // Show the user the banner message.
    Util.banner('error', banner_msg);

    // Give the user a data/timestamp so the problem can be tracked down.
    var date = new Date().toString(),
        i = date.indexOf('GMT');
    date = date.slice(0, i);
    
    // Display on create map log
    log_it('\nPlease let hexmap at ucsc dot edu know you ' +
        'had a map creation problem on ' + date);

    // Pop open the trouble shooting help page.
    window.open(URL_BASE + "/help/createMapTrouble.html");
}

function getProjectName () {
    return ui.get('major_project') + '/' + ui.get('minor_project') + '/';
}

function view_dir () {
    return VIEW_DIR + getProjectName();
}

function create_map () {

    // Send the create map request to the server.
    log_it('Requesting map creation...');
         
    var opts = [
        '--layoutInputFile', feature_data_id,
        '--layoutInputFormat', ui.get('feature_format'),
        '--layoutName', 'layout',
        '--outputDirectory', view_dir(),
    ];
    
    if (attribute_data_id) {
        opts.push('--colorAttributeFile');
        opts.push(attribute_data_id);
    }
    
    if (ui.get('tete_method')) {
        opts.push('--layoutMethod');
        opts.push('t-ETE');
    }
    
    if (ui.get('display_default').length > 0) {
        opts.push('--firstAttribute');
        opts.push(ui.get('display_default'));
    }
    
    if (!ui.get('precompute_stats')) {
        opts.push('--noLayoutIndependentStats');
        opts.push('--noLayoutAwareStats');
    }
    
    if (ui.get('zeroReplace') && (ui.equals('layout_input', 'similarity') ||
        ui.equals('layout_input', 'coordinates'))) {
        opts.push('--zeroReplace');
    }

    if (DEV) {
        log_it('\nCompute request options: ' + opts);
        console.log('\nCompute request options: ' + opts);
    }

    //return;
    
    Meteor.call('create_map', opts, function (error) {
        if (error) {
            report_error('Error: ' + error);
            $dialogCreateButton.removeClass('ui-state-disabled');
            Session.set('mapSnake', false);

        } else {
            log_it('Map was successfully created and is loading now.');

            // Open the new map.
            Utils.loadProject(getProjectName());
        }
    });
}

function get_data_id (id) {
    return VIEW_DIR.slice(0, VIEW_DIR.length - 5) + id;
}

function upload_attributes () {

    // Upload the user's attribute file
    if (attribute_upload.refs.fileObj) {
        log_it('Uploading color attributes...\n')
        var startDate = new Date();
        Ajax.upload({
            mapId: ui.get('major_project') + '/' + ui.get('minor_project') + '/',
            sourceFile: attribute_upload.refs.fileObj,
            targetFile: attribute_upload.refs.fileObj.name,
            success: function (results, dataId) {
                //attribute_data_id = dataId;

                // TODO temporary until we implement relative paths in the
                // createMap_www.js in the compute server.
                attribute_data_id = get_data_id(dataId);

                log_it('Color attributes upload complete.')
                create_map();
            },
            error: function (msg) {
                log_it(msg)
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
    
    // Upload the feature file.
    if ($dialogCreateButton.hasClass('ui-state-disabled')) { return; }
    
    if (!feature_upload.refs.fileObj) {
        Util.banner('error',
            'a layout input file must be selected to create a map.')
        return;
    }
    
    // Show the progress snake and disable the create button.
    Session.set('mapSnake', true);
    $dialogCreateButton.addClass('ui-state-disabled');
    
    log_it('Uploading layout input...\n')
    var startDate = new Date();
    Ajax.upload({
        mapId: ui.get('major_project') + '/' + ui.get('minor_project') + '/',
        sourceFile: feature_upload.refs.fileObj,
        targetFile: feature_upload.refs.fileObj.name,
        success: function (results, dataId) {
            feature_data_id = dataId;

            // TODO temporary until we implement relative paths in the
            // createMap_www.js in the compute server.
            feature_data_id = get_data_id(dataId);

            log_it('Layout input upload complete.')
            upload_attributes();
        },
        error: function (msg) {
            log_it(msg)
        },
        progress: function (loaded, total) {
            log_it(null, startDate, loaded, total, true);
        },
    });
}

function build_dialog_content (username) {

    import React, { Component } from 'react';
    import { render } from 'react-dom';
    import Upload from '/imports/comp/upload.js';

     // Define the file selector for features file
    feature_upload = render(
        <Upload />, $dialog.find('.feature_upload_anchor')[0]);

    // Define the file selector for attributes file
    attribute_upload = render(
        <Upload />, $dialog.find('.attribute_upload_anchor')[0]);

    // Find a name to use for this user's projects that will be
    // safe to use as a directory name. TODO this should be made unique for
    // the corner case of the safe name duplicates another user's safe name.
    ui.set('major_project', Util.clean_file_name(username));

    // Initialize some ui values
    log.set('');
    
    // Create the feature format list
    var data = [];
    formats.forEach(function (format){
        data.push({id: format[0], text: format[1]});
    });
    var $format_anchor = $('#create_map_dialog .format_anchor');
    Util.createOurSelect2($format_anchor, {data: data},
        default_feature_format);
    $format_anchor.show();
    
    // Remove focus from question marks.
    $('#create_map_dialog .blur').blur();
    
    // Define some event handlers
    $('#create_map_dialog .minor_project').on('change', function (ev) {
         ui.set('minor_project', ev.target.value);
   });
    $format_anchor.on('change', function (ev) {
        ui.set('feature_format', ev.target.value);
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
    Util.get_username(function (username) {
    
        // User name has been received, set up the widgets.
        if (username) {
            build_dialog_content(username);
        } else {
            Util.banner('error', 'username could not be found');
        }
    });
}

function preShow () {

    // Check for this user having the credentials to do this.
    return Util.credentialCheck('to create a map');
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
    ui.set('feature_format', default_feature_format);
    ui.set('tete_method', false);
    ui.set('display_default', '');
    ui.set('minor_project', 'map');
    ui.set('precompute_stats', false);
    ui.set('zeroReplace', false);
    ui.set('show_advanced', false);

    // Listen for the menu clicked
    Tool.add("createMap", function() {
        dialogHex.show();
    }, 'Create a new map');
    
    
    // Also open the dialog if the home page thumbnail-like is clicked
    $('.createMapHome .createMap')
        .button()
        .on('click', function () {
        $button.click();
    });
}
