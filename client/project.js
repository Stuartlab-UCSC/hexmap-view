
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function Project() {
    };

    Project.prototype._populate = function () {
        // Populate the project list.
        // The projects object is of the form:
        //  {
		//      user1:	[proj1, proj2 ...],
		//      user2:	[proj3, proj4 ...],
        //      ...
        //  }
		//
        var self = this;

        data = _.map(self.projects, function (userProjs, user) {
            return {
                text: user,
                children: _.map(userProjs, function (proj) {
                    id = Session.get("proxPre") + 'data/' + user + '/' + proj + '/';
                    return { id: id, text: proj };
                })
            }
        });

        // Create the select2 drop-down
        $('#project').select2({
                data: data,
                placeholder: "Load Project",
            })
            // Handle result selection
            .on("select2-selecting", function(event) {

                // The select2 id of the thing clicked is event.val
                // Save the dir to session storage and reload the app
                ctx.save(event.val);
                queryFreeReload();
       });

        // Is the context project on our list?
        var projectOnList = _.find(data, function (user) {
            var projectMatch = _.find(user.children, function (proj) {
                var idMatch = (proj.id === ctx.project);
                return idMatch;
            });
            return !_.isUndefined(projectMatch);
        });
        if (projectOnList) {

            // Set the value in the select to the current project
            $('#project').select2("val", ctx.project);
        }

        // Make the bottom of the list within the main window
        $('#project').parent().on('select2-open', function () {
            var results = $('#select2-drop .select2-results');
            results.css('max-height', $(window).height() - results.offset().top - 15);
        });
	};

    Project.prototype._removeHiddenDirs = function (dirs) {
        return _.filter(dirs, function (dir) {
            return (dir.indexOf('.') !== 0);
        });
    };

    var users, projects;

    Project.prototype._getProjects = function (userIndex) {

        // Get one user's project directory names
        var self = this;

        Meteor.call('getDataDirs', self.users[userIndex], function (error, projects) {
            if (error) {
                console.log('_getProjects error', error);
                banner('warn', "Unable to retrieve user's project data.\n" + error);
            } else {

                // Save the user's projects
                var projects = self._removeHiddenDirs(projects);
                if (projects.length > 0) {
                    self.projects[self.users[userIndex]] = projects;
                }
                if (userIndex < self.users.length - 1) {

                    // Go get the next user's projects
                    self._getProjects(userIndex + 1);
                } else {

                    // Populate the project list
                    self._populate();
                }
            }
        });
    };

    Project.prototype._getUsers = function () {

        // Get the user directory names
        var self = this;

        Meteor.call('getDataDirs', function (error, users) {
            if (error) {
                console.log('_getUsers error', error);
                banner('warn', "Unable to retrieve project data.\n" + error);
            } else {

                // Save the user array & go get her projects
                self.users = self._removeHiddenDirs(users);
                self.projects = {};
                if (self.users.length > 0)
                    self._getProjects(0);
            }
        });
    };

    initProject = function () { // jshint ignore:line
        if (DEV) {
            var project = new Project();
            project._getUsers();
        } else {
            $('#project')
                .text(ctx.project.split('/').slice(-2,-1))
                .addClass('static');
        }
    };

})(app);
