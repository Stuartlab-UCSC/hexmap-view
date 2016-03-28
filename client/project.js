
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    // This will be an instance of this Project class.
    var project;
 
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
                    id = 'data/' + major + '/' + minor + '/';
                    return { id: id, text: minor };
                })
            } else {
                data.id = 'data/' + major + '/';
            }
            return data;
        });

        // Create the select2 drop-down
        $('#project')
            .select2({
                data: data,
                placeholder: "Load Project",
            })
            // Handle result selecting
            .on("select2-selecting", function(event) {

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
 
        // If a protected project was loaded before and the new user is not
        // authorized to see it, or there is no one logged in, load the default.
        if (!projectOnList) {
            ctx.save(ctx.defaultProject);
            queryFreeReload();
        }
 
        // Select the current project in the UI
        $('#project').select2("val", ctx.project);

        // Set our own text on the selected option when drop-down is closed
        $('#s2id_project .select2-choice span').text(ctx.project.slice(5, -1));

        // Make the bottom of the list within the main window
        setHeightSelect2($('#project'));
	};

    initProject = function () { // jshint ignore:line
 
        // Initialize projects whenever the username changes including log out
        Meteor.autorun(function() {
            var x = Meteor.user(); // Just to trigger execution
            
            if (!project) {
                project = new Project();
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
