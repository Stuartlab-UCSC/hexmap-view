// reflect.js
// This captures the user input to reflect a set of nodes on another map.

var app = app || {};

(function (hex) {
    //'use strict';

    var title = 'Reflect on Another Map',
        dialogHex,
        $dialog,
        mapIdList,
        mapId,
        selectionList,
        selectionSelected = ''; // Selected selection from the list of selections

    function show () {
 
        // Show the contents of the dialog, once per trigger button click
 
        // The the mapId is selected by the user, they select the map they want to see the reflection in
        // mapId selector:
        var data = [
            { id: 5, text: 'Pancan12/?' }, //TODO: replace with bettter way to get mapId
            { id: 6, text: 'Pancan12/?'},
        ];
        var $mapAnchor = $('#reflectDialog .mapIdAnchor');
        mapIdList = createOurSelect2($mapAnchor, {data: data}, 6);
        $mapAnchor.show();
 
        // The selection selector.
        selectionList = createLayerNameList($('#reflectDialog .layerNameListAnchor'),
                                    $('#reflectDialog .selectionListLabel'),
                                    selectionSelected);
        selectionList.enable(true, {selection: true});
 
        // Define the event handler for the selecting in the list
        $mapAnchor.on('change', function (ev) {
            mapId = ev.target.value;
        });
    }

    function mapManager (operation, toMapId, nodeIds) {
        
        //if (operation === 'reflectInAnotherMap') {
        //   
        //  //set script name
        //  var pyscr_name = 'reflection.py';
        //  
        //  //construct parmeters object to feed into pythonCaller.js
        //  parameters;
        //  
        //  parameters.datapath = 'path_to_the_data';
        //  parameters.node_ids = nodeIds
        //
        //  // determine which map they are in, and where the output
        //  // is going
        //  if (toMapId.substring(8,13) === 'Genes'){
        //      parameters.sampOrFeat = 'features';    
        //      parameters.out_file = 'directory_we_drop_in_if_genes';
        //  } else {
        //      parameters.sampOrFeat = 'samples';
        //      parameters.out_file = directory_we_drop_in_if_samps;
        //  }
        //  
        //  //call correct python script
        //  Meteor.call("pythonCall",parameters, function(err,res) {
        //      use as pattern don't use metoer.call callPython
        //      use future as shown in pythonCall
        //  });
        // when transfering need toMapId, userID
        
        // pull user out like Meteor.user().username /project.js gets project depending on user.
        // autorun, reactive variable changes script gets run, publish/suscribe
        // make a mailbox for the user 
        
        
        // shortlist layer stuff (add_layer_data), use that but
        // build up attributes properly (arg) 
        // initLayerIndex hexagram.js
        // [attribute: layer_positives = NaN ], first attributes in initLayerIndex() hexagram.js
        // colormaps - is a global, in hexagram.js initColormaps()
        // for each category in your layer (or integer) you need
        
        /* this is grabbing iteratively from a line in file colormaps.tab
        colormap[category_index] = {
                    name: parsed[i][j + 1], //i is layer name index  j is category index
                    color: Color(parsed[i][j + 2]), // operating color in map
                    fileColor: Color(parsed[i][j + 2]), // color from orig file
                };
                set global with layers colormap (above variable)
                            colormaps[layer_name] = colormap;

        */

        // get new layer in layers (G) and new colormap in colormaps (G) and display..
        // to display must add to shortlist, example in longlist.js 129-145 ish, session variable set--- make into a routine(make globablly accessible, global routines go at bottom of file)
        // longlist 121, 
        //

        /* I want to use display so the user can pick toMap
        Meteor.call('getProjects', function (error, projects) {
            if (error) {
                banner('warn', "Unable to retrieve project data.\n" + error);
                return;
            }
            console.log(projects) //this thing returns a JSON with arrays pointing to subprojects,
            //I want the sub projects to be selectable and those ids to be unique.
        });
        */
        //console.log(get_current_layers());
        //var layer_array = Session.get('sortedLayers').slice();
        //console.log(layer_array);
        //console.log('PAM50' in layers);
        
        console.log('Called mapManager stub with:',
            '\n    username:', Meteor.user().username,
            '\n    operation:', operation,
            '\n    toMapId:', toMapId,
            '\n    nodeIds:', nodeIds,
            '\n    selection:', selectionSelected);

        userId=Meteor.user().username;

        Meteor.call("mapManager",operation,userId,toMapId,nodeIds,selectionSelected,function (error,success){
        //Meteor.call("mapManager",'test',toMapId,nodeIds,function (error,success){
            if(error){
                console.log('Mapmanager: Operation' + operation + ' failed');
            } else {
                //console.log('not a success');
            }
        });

        // Add it to the sorted layer list, since it's not there yet.
        //layer_name ='test2'
        //var sorted = Session.get('sortedLayers').slice();
        //sorted.push(layer_name);
        //console.log(sorted);
        //sorted[layer_name]['filename'] = '/home/duncan/PycharmProjects/tumorMap/querrier/TMtoG/layer_4.tab';
        //Session.set('sortedLayers', sorted);

    }

    function mapIt () {
        // TODO get name of selection and feed it to manager
        // determine which map you are going to, only two options now

        if ('PAM50' in layers){
            toMapId = 'sample'
            console.log('you on genemap');
        } else {
            toMapId = 'feature'
            console.log('you on samplemap');
        }
        // Gather the user input and call the map manager.
        selectionSelected = selectionList.selected;
        console.log(selectionSelected);
        // Bail if no selection is selected
        if (_.isUndefined(selectionSelected)) return;
 
        var nodeIds = _.keys(layers[selectionList.selected].data);
        mapManager('reflection', toMapId, nodeIds);

        banner('info', 'Your other map will be updated shortly.');
        hide();
	}
 
    function hide() {
 
        // TODO clean up mapIdList
        /*
        mapId = mapIdList.selected;
        mapIdList.destroy();
        mapIdList = undefined;
        */
        selectionSelected = selectionList.selected;
        selectionList.destroy();
        selectionList = undefined;
        dialogHex.hide();
    }

    initReflect = function () {

        $dialog = $('#reflectDialog');
        var $button = $('#reflectTrigger');
 
        // Initialize our UI variables
        // duncan comment: Why here, I put it inside mapIt
        mapId = 'the map you are on';
 
        // Define the dialog options & create an instance of DialogHex
        var opts = {
            title: title,
            buttons: [{ text: 'Reflect', click: mapIt }],
        };
        dialogHex = createDialogHex($button, $dialog, opts, show,
            hide, true, '#fakeHelpAnchor');
 
        // Listen for the menu clicked
        $button.on('click', function () {
            dialogHex.show();
        });
 
        // Enable/Disable the menu option whenever the username changes,
        // including log out.
        Meteor.autorun(function() {
            var user = Meteor.user();
            
            // TODO this only changes its color, really disable it
            if (user) {
                $button.removeClass('ui-state-disabled');
            } else {
                $button.addClass('ui-state-disabled');
            }
        });
    }
})(app);
