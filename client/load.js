
// A tool to load data files from a directory within the webserver's doc dir

$(function() {

	// Download Information on project directories
	$.get("./getProjDirs", function(json_data) {
        /* The data is of the form:
        {
			public:	[proj1, proj2 ...],
			dir2:	[proj3, proj4 ...],
			dir2:	[proj5, proj6 ...],
        }
		*/

        var parsed, data;
        try {
            parsed = JSON.parse(json_data);
        }
        catch(err) {
            print('Unable to parse the project information from the server, so using public/pancan12stats');
            json_data = '[["public", "pancan12stats"]]';
        };

        // Transform to the structure needed for the dropdown
        data = _.map(JSON.parse(json_data), function (userProjs, user) {
            return {
                text: user,
                children: _.map(userProjs, function (proj) {
                    id = 'data/' + user + '/' + proj + '/';
                    return { id: id, text: proj };
                })
            }
        });

        $('#loadDir').select2({
                data: data,
                placeholder: "Load Project",
            })
            // Handle result selection
            .on("select2-selecting", function(event) {

                // The select2 id of the thing clicked is event.val
                ctx.project = event.val;

                // Save the dir to the session storage
                ctx.save();

                // Reload the app
                location.reload();
        });
        $('#loadDir').select2("val", ctx.project); //set the value in the select

	}, "text");
});
