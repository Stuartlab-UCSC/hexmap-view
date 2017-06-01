
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; 

(function (hex) { // jshint ignore: line
Project = (function () { // jshint ignore: line
    //'use strict';
 
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
 
    function populate () {
        // Populate the project list.
        // The projects object contains one- or two-tiered projects of the form:
        //  {
		//      major1:	[minor1, minor2 ...],
		//      major2:	[minor3, minor4 ...],
        //      major3: [],
        //      ...
        //  }
		//
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
 
        // Create the select2 drop-down
        $('#project')
            .select2({
                data: data,
                placeholder: PLACEHOLDER_TEXT,
                dropdownAutoWidth: true,
            })
            // Handle result selecting
            .on("select2-selecting", function(event) {
            
                $('#s2id_project .select2-choice span')
                    .removeClass('noProject');

                // The select2 id of the thing clicked is event.val
                Hex.loadProject(event.val);
            });

        // Make the bottom of the list within the main window
        Util.setHeightSelect2($('#project'));

        // If a protected project was loaded before and the new user is not
        // authorized to see it, or there is no one logged in, give a message
        // to the user.
        if (!is_project_on_list(ctx.project)) {
 
            // The project may be protected and has been loaded before under an
            // authorized account and is either in the user's saved state or
            // is a parameter in the URL.
 
            // Set the project to the placeholder
            $('#s2id_project .select2-choice span')
                .text(PLACEHOLDER_TEXT)
                .addClass('noProject');

            Util.banner('error', 'Please sign in to see this map: "' +
                Util.getHumanProject(ctx.project) +
                    '".\nOr select another map.');
 
        } else {

            // Select the current project in the UI
            $('#project').select2("val", ctx.project);
 
             // Set our own text on the selected option when drop-down is closed
            $('#s2id_project .select2-choice span')
                .text(Util.getHumanProject(ctx.project))
                .removeClass('noProject');
            Session.set('initedProject', true);
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
 
    return {
    
        make_name_unique: function (map_name) {
    
            // TODO we should clean the name if this is a name created by
            // the user
     
            // We're done if the name is unique
            if (!is_project_on_list(map_name)) { return map_name; }

            var last_suffix,
                name = map_name,
                seq = 1;
     
            // Keep looking for a name until it is unique
            while (true) {
     
                // We're done if the name is unique
                if (!is_project_on_list()) { break; }

                // Find any previously tried sequence suffix
                if (seq > 1) {
                    last_suffix = ' ' + (seq - 1);
                    if (name.endsWith(last_suffix)) {
     
                        // Remove the existing sequence suffix
                        name = name.slice(0, name.length - last_suffix.length);
                    }
                }
                name += ' ' + seq;
                seq += 1;
            }
            return name;
        },
     
        init: function () {
      
            $('.login').on('click', $('#login-sign-in-link'), signInClicked);
     
            // Repopulate projects whenever the user changes, including log out
            Meteor.autorun(function() {
                var user = Meteor.user(); // jshint ignore: line
                
                Meteor.call('getProjects', function (error, projects_returned) {
                    if (error) {
                        Util.banner('warn',
                            "Unable to retrieve project data.\n" + error);
                        return;
                    }
                    projects = projects_returned;
                    populate();
                });
            });
        },
    };
}());
})(app);
