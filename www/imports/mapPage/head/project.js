
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

import ajax from '/imports/mapPage/data/ajax';
import auth from '/imports/common/auth';
import React, { Component } from 'react';
import perform from '/imports/common/perform';
import { render } from 'react-dom';
import rx from '/imports/common/rx';
import Select22 from '/imports/component/Select22';
import userMsg from '/imports/common/userMsg';
import util from '/imports/common/util';
import utils from '/imports/common/utils';

// Placeholder text when no project is selected
var PLACEHOLDER_TEXT = 'Select a Map.../';

var projects; // project list
var data; // data for select widget
var prevListUsername = 'empty';
var prevAuthUsername = 'empty';
var unsubscribe = {};

function is_project_on_list (project) {

    // Is the context project on our list?
    return _.find(data, function (major) {
        if (major.id) {
            
            // This is a single-tier project
            return (major.id === project);
        } else {
        
            // This is a two-tier project
            var projectMatch = _.find(major.children, function (minor) {
                return (minor.id === project);
            });
            return !_.isUndefined(projectMatch);
        }
    });
}

function matcher (term, text, opt) {
    
    // Find matches given a term to search for, the text of the option,
    // and the option's data object.
    var lTerm = term.toLowerCase();
    
    // Is there a case-insensitive match with the option's text or its ID?
    // This will match any children whose parents match the term.
    if (text.toLowerCase().indexOf(lTerm) > -1 ||
        (opt.hasOwnProperty('id') &&
        opt.id.toLowerCase().indexOf(lTerm) > -1)) {
        return true;
    }
    return false;
}

function formatResult (row, container) {

    // Format a row in the result list.
    var style = '';
    if (row.hasOwnProperty('id') &&  // this is a leaf node
        row.id.indexOf('/') === row.id.lastIndexOf('/')) {
        
            // With only one slash this project is not part of a group but we
            // want to give it the importance of a group so we make it bold.
            style = "style='font-weight:bold'";
    }
    return "<div title='" + row.text + "'" + style + ">" + row.text + "</div>";
}

function populate () {

    // Populate the project list.
    // The project data contain single- or two-tiered projects of the form:
    // [
    //     {
    //          id: 'nested-1',
    //         text: 'First nested option'
    //     },
    //     // ... more single- or two-tiered data objects ...
    //     {
    //         text: 'Group label',
    //         children: [
    //             {
    //                 id: 'nested-1',
    //                 text: 'First nested option'
    //             },
    //             // ... more child data objects for many tiers ...
    //         ]
    //     },
    // ]

    if (!rx.get('projectList.receiving') && rx.get('init.headerLoaded')) {
        unsubscribe.populate();
        var selector;
    
        data = _.map(projects, function (minors, major) {
            var data = {text: major};
            if (minors.length) {
                data.children = _.map(minors, function (minor) {
                    var id = major + '/' + minor + '/';
                    return { id: id, text: minor };
                });
            } else {
                data.id = major + '/';
            }
            return data;
        });
    
        // Attach the selector.
        var value;
        if (is_project_on_list(ctx.project)) {
             value = ctx.project;
        } else {
            value = PLACEHOLDER_TEXT;
        }
        render(
            <Select22

                // Options for the original non-react select2.
                select2options = {{
                    data: data,
                    value: value,
                    placeholder: PLACEHOLDER_TEXT,
                    formatResult: formatResult,
                    width: '20em',
                    matcher: matcher,
                }}
                onChange = {function (event) {
                    utils.loadProject(event.val);
                }}
                choiceDisplay = {function (dataId) {
                    return dataId.slice(0, -1); // remove trailing '/' for display
                }}
            />, $('#project')[0]);
        
        perform.log('project-list-rendered');
        rx.set('projectList.changing.done');
    }
}

exports.authorize = function () {
    
    // Check to see if the user is authorized to view the project
    // every time the user changes.
    rx.set('user.mapAuthorized.not');
    ajax.getUserMapAuthorization(
        function (results) {
            if (results.authorized === true) {
                rx.set('user.mapAuthorized.yes');
            } else {
                util.mapNotFoundNotify();
            }
            perform.log('project:authorized:' + rx.get('user.mapAuthorized'));
        },
        function (error) {
            util.mapNotFoundNotify();
        }
    );

    // Re-populate projects whenever the user changes, including log out.
    perform.log('project:list-request');
    
    // Subscribe to state changes effecting the project list.
    rx.set('projectList.changing.now');
    rx.set('projectList.receiving.now');
    unsubscribe.populate = rx.subscribe(populate);
    
    // Retrieve the project list.
    ajax.getProjectList(
        function (results) {
            perform.log('project:list-got');
            projects = results;
            rx.set('projectList.receiving.done');
        },
        function (error) {
            userMsg.error("Unable to retrieve map list from server.");
        }
    );
};
