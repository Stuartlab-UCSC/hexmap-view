// layout.js

import data from '/imports/mapPage/data/data';
import hexagons from '/imports/mapPage/viewport/hexagons';
import viewport from '/imports/mapPage/viewport/viewport';
import perform from '/imports/common/perform';
import sort from '/imports/mapPage/longlist/sort';
import util from '/imports/common/util';

exports.findCurrentName = function () {
    var index = Session.get('layoutIndex'),
        layouts = Session.get('layouts');
    if (_.isUndefined(layouts) || _.isUndefined(index) ||
        index > layouts.length - 1) {
        
        // We don't know what to return.
        return undefined;
    } else {
        return Session.get('layouts')[index];
    }
};

exports.layoutNamesReceived = function (parsed) {

    // This is an array of rows, with one element in each row:
    // layout name.
    var layouts = [],
        layoutName = Session.get('layoutName'),
        index = Session.get('layoutIndex');
    for (var i = 0; i < parsed.length; i++) {
        var row = parsed[i];
        if (row.length === 0) {
            // Skip any blank lines
            continue;
        }
        layouts.push(row[0]);
    }
    
    // If we have no layoutIndex ...
    if (_.isUndefined(index)) {
    
        // If there is a layoutName supplied (via url) ...
        if (layoutName) {
            index = layouts.indexOf(layoutName);
            if (index < 0) {
            
                // Name not found in the list so default the index.
                index = 0;
            }
            
            // We no longer need the layoutName stored.
            Session.set('layoutName', undefined);
            //delete Session.key.layoutName;
        } else {

            // Default the current layout index to the first layout.
            index = 0;
        }
        Session.set('layoutIndex', index);
        
        perform.log('layouts-rendered');
        
        // Now request the node locations since we have an index.
        data.requestLayoutAssignments();
    }

    // Save the layout list.
    Session.set('layouts', layouts);
};

exports.initList = function () {

    // Transform the layout list into the form wanted by select2.
    var data = _.map(Session.get('layouts'), function (layout, i) {
        return { id: i, text: layout };
    });
    
    // Create our selection list.
    util.createOurSelect2($("#layout-search"), {data: data},
        Session.get('layoutIndex').toString());

    // Define the event handler for the selecting in the list.
    $("#layout-search").on('change', function (ev) {
        
        if (!Session.equals('layoutIndex', ev.target.value)) {
            Session.set('layoutIndex', ev.target.value);
            viewport.create();
            hexagons.getAssignmentsForMapViewChange();
            
            // Update density stats to this layout and
            // resort the list to the default of density
            sort.find_clumpiness_stats();
            import longlist from '/imports/mapPage/longlist/longlist.js';
            longlist.update();
        }
    });
};
