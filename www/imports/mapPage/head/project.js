
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

import Auth from '/imports/common/auth.js';
import React, { Component } from 'react';
import Perform from '/imports/common/perform.js';
import { render } from 'react-dom';
import rx from '/imports/common/rx.js';
import Select2 from '/imports/component/select2wrap.js';
import Util from '/imports/common/util.js';
import Utils from '/imports/common/utils.js';

// Placeholder text when no project is selected
var PLACEHOLDER_TEXT = 'Select a Map.../';

var projects; // project list
var data; // data for select widget
var prevListUsername = 'empty';
var prevAuthUsername = 'empty';

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

function notAuthdMessage () {

    // The user is not authorized to see the current project. Let her know.
    Session.set('mapSnake', false);

    var notFoundMsg = Util.getHumanProject(ctx.project) +
        " cannot be found.\nPlease select another map.";
    if (!Meteor.user()) {
        notFoundMsg += ' Or sign in.';
    }
    Util.banner('error', notFoundMsg);
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
        <Select2

            // Options for the original non-react select2.
            select2options = {{
                data: data,
                value: value,
                placeholder: PLACEHOLDER_TEXT,
                width: '20em',
                matcher: matcher,
            }}
            onChange = {function (event) {
                Utils.loadProject(event.val);
            }}
            choiceDisplay = {function (dataId) {
                return dataId.slice(0, -1); // remove trailing '/' for display
            }}
        />, $('#project')[0]);
    
    Perform.log('project:list-rendered');
}

function signInClicked(count) {

    // Set focus to the login-email input text box
    if (_.isUndefined(count)) { count = 0; }
    var reps = 20,
        mSecs = 100;
    Meteor.setTimeout(function () {
            if ($('#login-email').length > 0) {
                $('#login-email').focus();
            } else if (count < reps ) {
                signInClicked(count + 1);
            }
        }, mSecs);
}

exports.authorize = function (userId) {
    
    // Check to see if the user is authorized to view the project
    // every time the user changes.
    Meteor.call('is_user_authorized_to_view', ctx.project,
        function (error, results) {
            if (results) {
                rx.set(rx.act.INIT_MAP_AUTHORIZED);
                /* TODO: what is this for? seems to show snake after place nodes bookmark load.
                if (!rx.get(rx.bit.initAppMapRendered)) {
                    Session.set('mapSnake', true);
                }
                */
            } else {
                notAuthdMessage();
            }
            Perform.log('project:userId,authorized:' + userId + ',' +
                rx.get(rx.bit.initMapAuthorized));
        }
    );

    // Re-populate projects whenever the user changes, including log out.
    Perform.log('project:list-request,userId:' + userId);
    
    Meteor.call('getProjects', function (error, projects_returned) {
        if (error) {
            Util.banner('error',
                "Unable to retrieve project data from server." + error);
        } else {
            Perform.log('project:list-got');
            projects = projects_returned;
            populate();
        }
    });
};


    // This may be causing password to not allow focus on password error.
    //$('.login').on('click', $('#login-sign-in-link'), signInClicked);


