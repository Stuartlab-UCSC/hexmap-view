
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

import ajax from '/imports/mapPage/data/ajax';
import React from 'react';
import perform from '/imports/common/perform';
import { render } from 'react-dom';
import rx from '/imports/common/rx';
import Select22 from '/imports/component/Select22';
import userMsg from '/imports/common/userMsg';
import util from '/imports/common/util';
import { checkFetchStatus, loadProject, parseFetchedJson }
    from '/imports/common/utils';

// Placeholder text when no project is selected
var PLACEHOLDER_TEXT = 'Select a Map.../';

var projects; // project list
var data; // data for select widget
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

function formatResult (row) {

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

    if (!rx.get('projectList.receiving') && rx.get('init.domLoaded')) {
        unsubscribe.populate();
    
        data = projects.map((project) => {
            var group = project[0],
                subProjects = project[1],
                dataGroup = {text: group};
                
            if (_.isUndefined(subProjects)) {
                dataGroup.id = group + '/';
            } else {
                dataGroup.children = subProjects.map((sub) => {
                    return {
                        id: group + '/' + sub + '/',
                        text: sub
                    };
                });
            }
            return dataGroup;
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
                    loadProject(event.val);
                }}
                choiceDisplay = {function (dataId) {
                    return dataId.slice(0, -1); // remove trailing '/' for display
                }}
            />, $('#project')[0]);
        
        perform.log('project-list-rendered');
        rx.set('projectList.changing.done');
    }
}

function projectListReceived (results) {
    projects = results;
    perform.log('project:list-got');
    rx.set('projectList.receiving.done');
}

function getProjectList () {

    // Retrieve the list of projects to which this user has access.
    var user = Meteor.user(),
        url = HUB_URL + '/mapList';
    
    // If there is a signed-in user, get the email and roles.
    if (user) {
        url += '/email/' + user.username;
        var roles = rx.get('user.roles');
        if (roles.length > 0) {
            url += '/role/' + roles.join('+');
        }
    }
    fetch(url)
        .then(checkFetchStatus)
        .then(parseFetchedJson)
        .then(projectListReceived)
        .catch(() => {
            userMsg.error('Unable to retrieve map list.');
        });
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
        function () {
            util.mapNotFoundNotify();
        }
    );

    // Re-populate projects whenever the user changes, including log out.
    perform.log('project:list-request');
    
    // Subscribe to state changes effecting the project list.
    rx.set('projectList.changing.now');
    rx.set('projectList.receiving.now');
    unsubscribe.populate = rx.subscribe(populate);
    
    getProjectList();
};
