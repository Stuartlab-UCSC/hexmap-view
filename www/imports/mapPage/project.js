
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

import React, { Component } from 'react';
import Perform from '../common/perform.js';
import { render } from 'react-dom';
import Select2 from '../component/select2wrap.js';
import '../lib/select2.css';
import Util from '../common/util.js';
import Utils from '../common/utils.js';

// Placeholder text when no project is selected
var PLACEHOLDER_TEXT = 'Select a Map...';

var projects; // project list
var data; // data for select widget

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
     render(
        <Select2

            // Options for the original non-react select2.
            select2options = {{
                data: data,
                value: ctx.project,
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
    
    Perform.log('project-list-rendered');
    
    // If a protected project was loaded before and the new user is not
    // authorized to see it, or there is no one logged in, give a message
    // to the user.
    if (!is_project_on_list(ctx.project)) {
    
        // The project may be protected and has been loaded before under an
        // authorized account and is either in the user's saved state or
        // is a parameter in the URL.

        Session.set('mapSnake', false);

        var notFoundMsg = Util.getHumanProject(ctx.project) +
            ' cannot be found. Either you are not authorized to view ' +
            "it or it doesn't exist.\nPlease select another map.";
        if (!Meteor.user()) {
            notFoundMsg += ' Or sign in.';
        }
        Util.banner('error', notFoundMsg);
     }
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

exports.init = function () {

    // This may be causing password to not allow focus on password error.
    //$('.login').on('click', $('#login-sign-in-link'), signInClicked);

    // Re-populate projects whenever the user changes, including log out
    setTimeout(function () {
        Meteor.autorun(function() {
            var user = Meteor.user(); // jshint ignore: line
            
            Perform.log('project-list-get,-user:-' +
                (user ? user.username : 'none'));
            
            Meteor.call('getProjects', function (error, projects_returned) {
                if (error) {
                    Util.banner('error',
                        "Unable to retrieve project data from server." +
                        error);
                    return;
                }
            
                Perform.log('project-list-got');
                projects = projects_returned;
                populate();
            });
        });
    });
}
