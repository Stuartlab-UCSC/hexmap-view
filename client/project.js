
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    // Placeholder text when no project is selected
    var PLACEHOLDER_TEXT = 'Select Project...';
 
    // This will be an instance of this Project class.
    var project;
 
    // Give this a value when the user has asked for a project that cannot be found.
    var unFoundProject;
 
    // Define a Project class.
    function Project() {};

    Project.prototype._populate = function () {
        // Populate the project list.
        // The projects object contains one- or two-tiered projects of the form:
        //  {
		//      major1:	[minor1, minor2 ...],
		//      major2:	[minor3, minor4 ...],
        //      major3: [],
        //      ...
        //  }
		//
        var self = this;

        data = _.map(self.projects, function (minors, major) {
            var data = {text: major};
            if (minors.length) {
                data.children = _.map(minors, function (minor) {
                    id = major + '/' + minor + '/';
                    return { id: id, text: minor };
                })
            } else {
                data.id = major + '/';
            }
            return data;
        });
 
        // Create the select2 drop-down
        $('#project')
            .select2({
                data: data,
                placeholder: PLACEHOLDER_TEXT,
            })
            // Handle result selecting
            .on("select2-selecting", function(event) {
            
                $('#s2id_project .select2-choice span').removeClass('noProject');

                // The select2 id of the thing clicked is event.val
                // Save the dir to session storage and reload the app
                if (event.val !== ctx.project) {
                    ctx.save(event.val);
                    queryFreeReload();
                }
            
            });

        // Is the context project on our list?
        var projectOnList = _.find(data, function (major) {
            if (major.id) {
                
                // This is a single-tier project
                return (major.id === ctx.project);
            } else {
            
                // This is a two-tier project
                var projectMatch = _.find(major.children, function (minor) {
                    return (minor.id === ctx.project);
                });
                return !_.isUndefined(projectMatch);
            }
        });
 
        // Make the bottom of the list within the main window
        setHeightSelect2($('#project'));

        // If a protected project was loaded before and the new user is not
        // authorized to see it, or there is no one logged in, load the default.
        if (!projectOnList) {
 
            // The project may be protected and has been loaded before under an
            // authorized account and is either in the user's saved state or
            // is a parameter in the URL.
 
            // Lock the user out of this project
            unFoundProject = ctx.project;
            ctx.project = undefined;
 
            // Set the project to the placeholder
            $('#s2id_project .select2-choice span')
                .text(PLACEHOLDER_TEXT)
                .addClass('noProject');

            alert('Please sign in to see project "' 
                + getHumanProject(unFoundProject) + '".\n');
 
        } else if (ctx.project) {

            // Select the current project in the UI
            $('#project').select2("val", ctx.project);
 
             // Set our own text on the selected option when drop-down is closed
            $('#s2id_project .select2-choice span')
                .text(getHumanProject(ctx.project))
                .removeClass('noProject');
            Session.set('initedProject', true);
         }
 
         if (!ctx.project) {
 
            // Turn off the snake
            Session.set('loadingMap', false);
         }
	};
 
    function signInClicked(count) {
 
        // Set focus to the login-email input text box
        if (_.isUndefined(count)) count = 0;
        var reps = 20,
            mSecs = 100,
            timer = setTimeout(function () {
                if ($('#login-email').length > 0) {
                    $('#login-email').focus();
                } else if (count < reps ) {
                    loginFocus(count + 1);
                }
            }, mSecs);
	};
 
    initProject = function () { // jshint ignore:line
  
        $('.login').on('click', $('#login-sign-in-link'), signInClicked);
 
        // Repopulate projects whenever the username changes, including log out
        Meteor.autorun(function() {
            var x = Meteor.user();
            
            if (!project) {
                project = new Project();
            }
            
            if (unFoundProject) {
                // Set the project requested to be found again now that the
                // user's login status has changed.
                ctx.project = unFoundProject;
            }
            
            Meteor.call('getProjects', function (error, projects) {
                if (error) {
                    banner('warn', "Unable to retrieve project data.\n" + error);
                    return;
                }
                project.projects = projects;
                project._populate();
            });
        });
    };

})(app);
