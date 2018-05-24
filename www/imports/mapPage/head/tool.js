
// tools.js: Code to run the tools in the menu bar that use map events.

// To add a tool:
// * Make a $(function() {...}); block to hold your code.
// * Add a tool with tool.add with your tool code as the callback.
// * Add at least one tool listener with add_tool_listener. Give it cleanup code
//   if necessary to remove temporary UI elements.
// * Make sure to call tool.activity with false when your tool's normal
//   workflow completes, so that the infowindow can use click events again.
//   (it got set to your tool's name by the code prepended to your callback).

import '/imports/mapPage/head/header.html';
import '/imports/mapPage/calc/reflect.html';
import '/imports/mapPage/shortlist/setOper.html';
import '/imports/mapPage/calc/overlayNode.html';

// This is an array of all Google Maps events that tools can use.
var TOOL_EVENTS = [
    "click",
    "dblclick",
    "mousemove",
];
var callbacks = {}; // The callbacks for each tool

// This holds all the currently active tool event listeners.
// They are indexed by handle, and are objects with a "handler" and "event".
var tool_listeners = {};

// Initialize the next tool listener handle to give out
var tool_listener_next_id = 0;

// Initialize the tool-in-use indicator.
var toolActive = false;

function add_tool_listener (name, handler, cleanup) {
    // Add a global event listener over the Google map and everything on it.
    // name specifies the event to listen to, and handler is the function to
    // be set up as an event handler. It should take a single argument: the
    // Google Maps event. A handle is returned that can be used to remove
    // the event listen with remove_tool_listener.
    // Only events in the TOOL_EVENTS array are allowed to be passed for
    // name.
    // TODO: Bundle this event thing into its own object.
    // If "cleanup" is specified, it must be a 0-argument function to call
    // when this listener is removed.
    
    // Get a handle
    var handle = tool_listener_next_id;
    tool_listener_next_id++;
    
    // Add the listener for the given event under that handle.
    // TODO: do we also need to index this for O(1) event handling?
    tool_listeners[handle] = {
        handler: handler,
        event: name,
        cleanup: cleanup
    };
    return handle;  
}

function remove_tool_listener (handle) {
    // Given a handle returned by add_tool_listener, remove the listener so
    // it will no longer fire on its event. May be called only once on a
    // given handle. Runs any cleanup code associated with the handle being
    // removed.
    
    if(tool_listeners[handle].cleanup) {
        // Run cleanup code if applicable
        tool_listeners[handle].cleanup();
    }
    
    // Remove the property from the object
    delete tool_listeners[handle];
}

export function getCallback (toolName) {
    return callbacks[toolName]
}

exports.add = function (tool_name, callback, hover_text, klass) {

    // Register a name for a tool that matches the select data in a
    // navigation bar option, and a callback for when the user selects
    // that menu option.

    // Save the callback
    // The last tool registered with this name wins
    callbacks[tool_name] = callback;

    // Add hover text & class to the menu option belonging to this tool
    var id = '#navBar .' + tool_name;
    $(id)
        .on('click', callbacks[tool_name])
        .attr('title', hover_text)
        .addClass(klass);
};

exports.activity = function (activate) {
    if (_.isUndefined(activate)) {
    
        // Return the state of the tool activity. Only one may be active at
        // a time so we know who is receiving mouse events on the map.
        return toolActive;
    } else {
    
        // Set the activity to the given activate of true or false.
        toolActive = activate;
    }
};

exports.subscribe_listeners = function (maps_object) {
    // Put the given Google Maps object into the tool events system, so
    // that events on it will fire global tool events. This can happen
    // before or after the tool events themselves are enabled.
    
    for(var i = 0; i < TOOL_EVENTS.length; i++) {
        // For each event name we care about,
        // use an inline function to generate an event name specific
        // handler, and attach that to the Maps object.
        google.maps.event.addListener(maps_object, TOOL_EVENTS[i], 
            function(event_name) { // jshint ignore: line
                return function(event) {
                    // We are handling an event_name event
                    
                    for(var handle in tool_listeners) {
                        if(tool_listeners[handle].event ===
                            event_name) {
                            
                            // The handler wants this event
                            // Fire it with the Google Maps event args
                            tool_listeners[handle].handler(event);
                        }
                    }
                };
            }(TOOL_EVENTS[i]));
    }
};

exports.initLabel = function () {
    import '/imports/lib/mapLabel.js';

    // Set up the add text control
    exports.add("addText", function() {
        
        // We'll prompt the user for some text, and then put a label
        // where they next click.
        
        var text = prompt("Enter some text, and click anywhere on " +
            "the map to place it there", "Label Text");
            
        if(!text) {
            // They don't want to put a label
            exports.activity(false);
            return;
        }
        
        // Add a tool listener that places the label. It fires on a
        // click anywhere on anything on the map, including the
        // background. We keep a handle to it so we can remove it when
        // it fires, ensuring we get just one label.
        // See http://stackoverflow.com/a/1544185
        var handle = add_tool_listener("click", function(event) {
            
            // Make a new MapLabel at the click position
            // See the MapLabel library example page.
            var map_label = new MapLabel({
                text: text,
                position: event.latLng,
                map: googlemap,
                fontSize: 12,
                align: "left"
            });
            
            // Listen to mouse events on this new label
            exports.subscribe_listeners(map_label);
            
            // Don't trigger again
            remove_tool_listener(handle);
        }, function() {
            // Cleanup: de-select ourselves.
            exports.activity(false);
        });
    }, 'Add a label to the map', 'mapShow');
};
