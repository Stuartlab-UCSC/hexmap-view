
// atools.js: Code to run the tools in the menu bar that use map events.
// References globals in hexagram.js to actually do the tools' work.

// To add a tool:
// * Make a $(function() {...}); block to hold your code.
// * Add a tool with add_tool with your tool code as the callback.
// * Add at least one tool listener with add_tool_listener. Give it cleanup code
//   if necessary to remove temporary UI elements.
// * Make sure to call tool_activity with false when your tool's normal
//   workflow completes, so that the infowindow can use click events again.
//   (it got set to your tool's name by the code prepended to your callback).

var app = app || {};

(function (hex) { // jshint ignore: line
Tool = (function () { // jshint ignore: line

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

    function activity (activate) {
        if (_.isUndefined(activate)) {
        
            // Return the state of the tool activity. Only one may be active at
            // a time so we know who is receiving mouse events on the map.
            return toolActive;
        } else {
        
            // Set the activity to the given activate of true or false.
            toolActive = activate;
        }
    }

    function add (tool_name, callback, hover_text, klass) {

        // Register a name for a tool that matches the select data in a
        // navigation bar option, and a callback for when the user selects
        // that menu option.
 
        // No need to add a tool twice
        if (callbacks[tool_name]) { return; }

        // Save the callback
        callbacks[tool_name] = callback;

        // Add hover text & class to the menu option belonging to this tool
        var id = '#navBar .' + tool_name;
        $(id)
            .on('click', callbacks[tool_name])
            .attr('title', hover_text)
            .addClass(klass);
    }

    return { // Public methods
    
        activity: activity,
        add: add,
    
        subscribe_listeners: function (maps_object) {
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
        },
        
        initLabelTool: function () {

            // Set up the add text control
            add("addText", function() {
                
                // We'll prompt the user for some text, and then put a label
                // where they next click.
                
                var text = prompt("Enter some text, and click anywhere on " +
                    "the map to place it there", "Label Text");
                    
                if(!text) {
                    // They don't want to put a label
                        activity(false);
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
                        fontSize: 10,
                        align: "left"
                    });
                    
                    // Listen to mouse events on this new label
                    Tool.subscribe_listeners(map_label);
                    
                    // Don't trigger again
                    remove_tool_listener(handle);
                }, function() {
                    // Cleanup: de-select ourselves.
                        activity(false);
                });
            }, 'Add a label to the map', 'mapShow');
        },
        
        init: function () {
     
            // Initialize for the page we are on, first enabling all
            $('#navBar *').removeClass('disabled');
            if (Session.equals('page', 'homePage')) {
                $('body').find('.mapShow, .gridShow').hide();
                $('body').find('.homeShow').show();
                Session.set('loadingMap', false);
                $('body').css('overflow-y', 'auto');
     
            } else if (Session.equals('page', 'mapPage')) {
                $('body').find('.homeShow, .gridShow').hide();
                $('body').find('.mapShow').show();
                $('.mapLayout, .reflectTrigger').addClass('disabled');
                Session.set('loadingMap', true);
                $('body').css('overflow-y', 'hidden');
     
            } else if (Session.equals('page', 'gridPage')) {
                $('body').find('.homeShow, .mapShow').hide();
                $('body').find('.gridShow').show();
                $('.gridPage').addClass('disabled');
                Session.set('loadingMap', true);
                $('body').css('overflow-y', 'hidden');
            }
        
            // Set up the link to the map page
            add("mapLayout", function(ev) {
                if (!$(ev.target).hasClass('disabled')) {
                    $('.mapPage').click();
                    activity(false);
                }
            }, 'Main map page');
     
            // Set up the link to the home page
            add("home", function() {
                $('.homePage').click();
                activity(false);
            });
        
            var $placeNodeMenuOpt = $('#navBar .overlayNode');
            var $overlayNodes = $(
                '#navBar .overlayNode, ' +
                '#navBar .queryDocs'
            );
        
            var $createMap = $(
                '#navBar .createMap, ' +
                '#navBar .createMapDocs, ' +
                '#navBar .input_files, ' +
                '#homePage .createMapHome'
            );
        
            var $job = $(
                '#navBar .jobs'
            );
        
            // Hide, show or disable tools depending on user's authorizations
            // and sometimes other criteria
            Meteor.autorun( function () {
                var user = Meteor.user(); // jshint ignore: line

                // Check authorization for running jobs.
                Meteor.call('is_user_in_role', ['jobs', 'dev'],
                    function (error, results) {
                        if (!error && results) {
                            $job.show();
                            $createMap.show();
                
                            // Enable/disable the place nodes menu option
                            // depending on availabiity of data required.
                            // TODO should we stop this autorun
                            // if the user is not logged in?
                            Meteor.autorun( function () {
                                var layoutName = Session.get('layouts')[
                                    Session.get('layoutIndex')];

                                if (Util.inAvailableMapLayouts(
                                        layoutName,
                                        Util.getHumanProject(ctx.project),
                                        'placeNode')) {
                                    $placeNodeMenuOpt.removeClass('disabled');
                                } else {
                                    $placeNodeMenuOpt.addClass('disabled');
                                }
                            })

                       } else {
                            $job.hide();
                            $createMap.hide();
                            $overlayNodes.hide();
                        }
                    }
                );
            });
        },
    };
}());

// TODO needed while transitioning to more scope protection
add_tool = Tool.add;
tool_activity = Tool.activity;

})(app);

