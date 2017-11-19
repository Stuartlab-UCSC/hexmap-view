// layout.js

import Data from '/imports/mapPage/data/data.js';
import Hexagons from '/imports/mapPage/viewport/hexagons.js';
import Hexagram from '/imports/mapPage/viewport/hexagram.js';
import Perform from '/imports/common/perform.js';
import Sort from '/imports/mapPage/longlist/sort.js';
import Util from '/imports/common/util.js';

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
        
        Perform.log('layouts-rendered');
        
        // Now request the node locations since we have an index.
        Data.requestLayoutAssignments();
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
    Util.createOurSelect2($("#layout-search"), {data: data},
        Session.get('layoutIndex').toString());

    // Define the event handler for the selecting in the list.
    $("#layout-search").on('change', function (ev) {
        
        if (!Session.equals('layoutIndex', ev.target.value)) {
            Session.set('layoutIndex', ev.target.value);
            Hexagram.createMap();
            Hexagons.getAssignmentsForMapViewChange();
            
            // Update density stats to this layout and
            // resort the list to the default of density
            Sort.find_clumpiness_stats();
            Session.set('sort', ctx.defaultSort());
            import Longlist from '/imports/mapPage/longlist/longlist.js';
            Longlist.update();
        }
    });
};
