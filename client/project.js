
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    function Project() {
    };

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
                ctx.save(event.val);
                queryFreeReload();
            });

        // Is the context project on our list?
        var projectOnList = _.find(data, function (major) {
            if (major.id) {
                
                // This is a single-tier project
                return (major.id === ctx.project);
            } else {
                var projectMatch = _.find(major.children, function (minor) {
                    return (minor.id === ctx.project);
                });
                return !_.isUndefined(projectMatch);
            }
        });
        if (projectOnList) {

            // Set the value in the select to the current project
            $('#project').select2("val", ctx.project);
 
            // And set our own text on the selected option when drop-down is closed
            $('#s2-d_project .select2-choice span').text(ctx.project.slice(5, -1));
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

    var minors;

    Project.prototype._removeFile = function (majorIndex, minorIndex) {

        // Remove the non-directories from the projects' minor lists
        // The major's list is assumed to be all directories
        var self = this,
            major = self.majors[majorIndex];
 
        if (!major) {
 
            // We've processed all the entries, so populate.
            self._populate();
            return;
        }
 
        var minor = self.projects[major][minorIndex];
        if (!minor) {
 
            // There are no more minors for this major,
            // so process the next major's first minor entry.
            self._removeFile(majorIndex + 1, 0);
            return;
        }
 
        var entry = 'data/' + major + '/' + minor;
 
        Meteor.call('isDataDir', entry, function (error, isDir) {
            if (error) {
                console.log('_removeFile error on', entry, 'of', error);
                banner('warn', "Unable to retrieve project directory data.\n" + error);
            } else {

                // Remove the minor if it is not a directory
                if (!isDir) {
                    self.projects[major].splice(minorIndex, 1);
                    minorIndex -= 1;
                }
                    
                // Process the major's next minor entry
                self._removeFile(majorIndex, minorIndex + 1);
            }
        });
    };

    Project.prototype._getMinors = function (majorIndex) {

        // Get one major's minor directory names
        var self = this;

        Meteor.call('getDataDirs', self.majors[majorIndex], function (error, minors) {
            if (error) {
                console.log('_getMinors error', error);
                banner('warn', "Unable to retrieve project's minor data.\n" + error);
            } else {

                // Save the major's minors to our projects object
                self.projects[self.majors[majorIndex]]
                    = self._removeHiddenDirs(minors);
                if (majorIndex < self.majors.length - 1) {

                    // Go get the next major's minors
                    self._getMinors(majorIndex + 1);
                } else {

                    // We've got all the minors, so remove any entries that
                    // are a file rather than a directory
                    self._removeFile(0, 0);
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
