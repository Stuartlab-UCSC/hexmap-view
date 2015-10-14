
// project.js: A UI to load data files from a directory within the webserver's
// doc dir

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function Project() {
    };

    //Project.prototype.getProjects = function () {
        // Download Information on project directories
    //    $.get("./getProjDirs", function(json_data) {
    //        Project.prototype.populate(JSON.parse(json_data));
    //    });
    //}

    Project.prototype._getProjects = function () {
        Project.prototype._populate({
            'public': ['pancan12'],
            'mcrchopra': ['first'],
            'sokolov': ['stemness'],
            'swat': ['paper', 'tiny'],
            'ynewton': ['gliomas-paper'],
        });
    };

    Project.prototype._populate = function (parsed) {
        // Populate the project list.

        // The data is of the form:
        //{
		//	public:	[proj1, proj2 ...],
		//	dir2:	[proj3, proj4 ...],
		//	dir2:	[proj5, proj6 ...],
        //}
		//
        data = _.map(parsed, function (userProjs, user) {
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

        // Is the context project a valid project?
        var validProject = _.find(data, function (user) {
            var projectMatch = _.find(user.children, function (proj) {
                var idMatch = (proj.id === ctx.project);
                return idMatch;
            });
            return !_.isUndefined(projectMatch);
        });
        if (validProject) {

            // Set the value in the select to the current project
            $('#project').select2("val", ctx.project);
        } else {
            alert('Sorry, "' + ctx.project + '" is not a valid project, loading the default instead.');
            ctx.project = ctx.getDefaultProject();
            queryFreeReload();
        }

        // Make the bottom of the list within the main window
        $('#project').parent().on('select2-open', function () {
            var results = $('#select2-drop .select2-results');
            results.css('max-height', $(window).height() - results.offset().top - 15);
        });
	};

    Project.prototype._initialize = function () {
        // Set up the project widgets.
        Project.prototype._getProjects();
    };

    initProject = function () { // jshint ignore:line
        if (DEV) {
            var project = new Project();
            project._initialize();
        } else {
            $('#project')
                .text(ctx.project.split('/').slice(-2,-1))
                .addClass('static');
        }
    };

})(app);
