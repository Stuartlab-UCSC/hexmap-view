
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function Project() {
    };

    Project.prototype._populate = function () {
        // Populate the project list.
        // The projects object is two-tiered of the form:
        //  {
		//      major1:	[minor1, minor2 ...],
		//      major2:	[minor3, minor4 ...],
        //      ...
        //  }
		//
        var self = this;

        data = _.map(self.projects, function (minors, major) {
            return {
                text: major,
                children: _.map(minors, function (minor) {
                    id = 'data/' + major + '/' + minor + '/';
                    return { id: id, text: minor };
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
        var projectOnList = _.find(data, function (major) {
            var projectMatch = _.find(major.children, function (minor) {
                var idMatch = (minor.id === ctx.project);
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

    var majors, minors;

    Project.prototype._getMinors = function (majorIndex) {

        // Get one major's minor directory names
        var self = this;

        Meteor.call('getDataDirs', self.majors[majorIndex], function (error, minors) {
            if (error) {
                console.log('_getMinors error', error);
                banner('warn', "Unable to retrieve project's minor data.\n" + error);
            } else {

                // Save the major's minors
                var minors = self._removeHiddenDirs(minors);
                if (minors.length > 0) {
                    self.projects[self.majors[majorIndex]] = minors;
                }
                if (majorIndex < self.majors.length - 1) {

                    // Go get the next major's minors
                    self._getMinors(majorIndex + 1);
                } else {

                    // Populate the project list
                    self._populate();
                }
            }
        });
    };

    Project.prototype._getMajors = function () {

        // Get the major directory names
        var self = this;

        Meteor.call('getDataDirs', function (error, majors) {
            if (error) {
                banner('warn', "Unable to retrieve project data.\n" + error);
            } else {

                // Save the major array & go get the minor projects
                self.majors = self._removeHiddenDirs(majors);
                self.projects = {};
                if (self.majors.length > 0)
                    self._getMinors(0);
            }
        });
    };

    initProject = function () { // jshint ignore:line
        if (DEV) {
            var project = new Project();
            project._getMajors();
        } else {
            $('#project')
                .text(ctx.project.slice(5, -1))
                .addClass('static');
        }
    };

})(app);
