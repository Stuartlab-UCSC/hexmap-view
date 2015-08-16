// tools.js: Code to run all the tools in the menu bar.
// References globals in hexagram.js to actually do the tools' work.

// To add a tool:
// * Make a $(function() {...}); block to hold your code.
// * Add a tool with add_tool with your tool code as the callback.
// * Add at least one tool listener with add_tool_listener. Give it cleanup code
//   if necessary to remove temporary UI elements.
// * Make sure to set oper.tool_selected to undefined when your tool's normal 
//   workflow completes, so that the infowindow can use click events again.
//   (it got set to your tool's name by the code prepended to your callback).

var app = app || {}; // jshint ignore:line

(function (hex) {
    //'use strict';

    // This is an array of all Google Maps events that tools can use.
    var TOOL_EVENTS = [
        "click",
        "mousemove"
    ];
    
    // This holds all the currently active tool event listeners.
    // They are indexed by handle, and are objects with a "handler" and an "event".
    var tool_listeners = {};

    // This holds the next tool listener handle to give out
    var tool_listener_next_id = 0;


    function add_tool_listener(name, handler, cleanup) {
        // Add a global event listener over the Google map and everything on it. 
        // name specifies the event to listen to, and handler is the function to be
        // set up as an event handler. It should take a single argument: the Google 
        // Maps event. A handle is returned that can be used to remove the event 
        // listen with remove_tool_listener.
        // Only events in the TOOL_EVENTS array are allowed to be passed for name.
        // TODO: Bundle this event thing into its own object.
        // If "cleanup" is specified, it must be a 0-argument function to call when
        // this listener is removed.
        
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

    function remove_tool_listener(handle) {
        // Given a handle returned by add_tool_listener, remove the listener so it
        // will no longer fire on its event. May be called only once on a given 
        // handle. Runs any cleanup code associated with the handle being removed.
        
        if(tool_listeners[handle].cleanup) {
            // Run cleanup code if applicable
            tool_listeners[handle].cleanup();
        }
        
        // Remove the property from the object
        delete tool_listeners[handle];
    }

    function clear_tool_listeners() {
        // We're starting to use another tool. Remove all current tool listeners. 
        // Run any associated cleanup code for each listener.
        
        for(var handle in tool_listeners) {
            remove_tool_listener(handle);
        }
    }

    subscribe_tool_listeners = function (maps_object) {
        // Put the given Google Maps object into the tool events system, so that 
        // events on it will fire global tool events. This can happen before or 
        // after the tool events themselves are enabled.
        
        for(var i = 0; i < TOOL_EVENTS.length; i++) {
            // For each event name we care about,
            // use an inline function to generate an event name specific handler,
            // and attach that to the Maps object.
            google.maps.event.addListener(maps_object, TOOL_EVENTS[i], 
                function(event_name) {
                    return function(event) {
                        // We are handling an event_name event
                        
                        for(var handle in tool_listeners) {
                            if(tool_listeners[handle].event == event_name) {
                                // The handler wants this event
                                // Fire it with the Google Maps event args
                                tool_listeners[handle].handler(event);
                            }
                        }
                    };
            }(TOOL_EVENTS[i]));
        }
    }

    add_tool = function (tool_name, tool_menu_option, callback, hover_text) {
        // Given a programmatic unique name for a tool, some text for the tool's
        // button, and a callback for when the user clicks that button, add a tool
        // to the tool menu.
        
        // This holds a button to activate the tool.
        var tool_button = $("<a/>").attr({"id": "tool_" + tool_name, "href": "#"}).addClass("stacker");
        tool_button.text(tool_menu_option);
        tool_button.click(function() {
            // New tool. Remove all current tool listeners
            clear_tool_listeners();
            
            // Say that the tool is selected
            oper.tool_selected = tool_name;

            callback();
            
            // End of tool workflow must set current_tool to undefined.
        });
        if (hover_text) {
            tool_button.prop('title', hover_text);
        }
        
        $("#toolbar").append(tool_button);
    }

    initTools = function () {

        // Set up the link to the home page
        add_tool("to-home", "Home", function() {
            $('.homePage').click();
            oper.tool_selected = undefined;
        });

        // Set up the add text control
        add_tool("add-text", "Add Text", function() {

            // We'll prompt the user for some text, and then put a label where they 
            // next click.
            
            var text = prompt("Enter some text, and click anywhere on the " +
                "visualization to place it there", "Label Text");
                
            if(!text) {
                // They don't want to put a label
                oper.tool_selected = undefined;
                return;
            }
            
            // Add a tool listenerr that places the label. It fires on a click 
            // anywhere on anything on the map, including the background. We keep a 
            // handle to it so we can remove it when it fires, ensuring we get just 
            // one label. See http://stackoverflow.com/a/1544185
            var handle = add_tool_listener("click", function(event) {
                
                // Make a new MapLabel at the click position
                // See http://bit.ly/18MbLhR (the MapLabel library example page)
                var map_label = new MapLabel({
                    text: text,
                    position: event.latLng,
                    map: googlemap,
                    fontSize: 10,
                    align: "left"
                });
                
                // Subscribe tool listeners to the label
                subscribe_tool_listeners(map_label);
                
                // Don't trigger again
                remove_tool_listener(handle);
            }, function() {
                // Cleanup: de-select ourselves.
                oper.tool_selected = undefined;
            });
        });

        // Set up the selection tool
        add_tool("select", "Select", function() {
        
            // Turn on a crosshair cursor
            googlemap.setOptions({
                draggableCursor:"crosshair"
            });
        
            // Add a listener to start the selection where the user clicks
            var start_handle = add_tool_listener("click",
                function(event) {
                
                // Don't trigger again
                remove_tool_listener(start_handle);
                
                // Turn on a crosshair cursor again
                googlemap.setOptions({
                    draggableCursor:"crosshair"
                });
                
                // Store the start of the selection
                var selection_start = event.latLng;
                
                print("Selection started at " + selection_start);
                
                // Make a rectangle for the selection
                var rectangle = new google.maps.Rectangle({
                    fillColor: "#FFFFFF",
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                    strokeOpacity: 1.0,
                    fillOpacity: 0.5,
                    // Don't give us a clickable cursor, or take mouse events.
                    clickable: false, 
                    map: googlemap,
                    bounds: new google.maps.LatLngBounds(selection_start, 
                        selection_start)
                });
                
                // This holds a selection preview event handler that should happen
                // when we mouse over the map or the rectangle.
                var preview = function(event) {
                    
                    // Store the end of the selection (provisionally)
                    var selection_end = event.latLng;
                    
                    
                    if(selection_end.lng() < selection_start.lng()) {
                        // The user has selected a backwards rectangle, which wraps
                        // across the place where the globe is cut. None of our 
                        // selections ever need to do this.
                        
                        // Make the rectangle backwards
                        rectangle.setBounds(new google.maps.LatLngBounds(
                            selection_end, selection_start));    
                        
                    } else {
                        // Make the rectangle forwards
                        rectangle.setBounds(new google.maps.LatLngBounds(
                            selection_start, selection_end));    
                    }
                }
                
                // This holds a cleanup function to get rid of the rectangle when 
                // the resizing listener goes away.
                var preview_cleanup = function() {
                    // Remove the rectangle
                    rectangle.setMap(undefined);
                    
                    // Remove the crosshair cursor
                    googlemap.setOptions({
                        draggableCursor: undefined
                    });
                };
                
                // Add a mouse move listener for interactivity
                // Works over the map, hexes, or the rectangle.
                var move_handle = add_tool_listener("mousemove", preview, 
                    preview_cleanup);
                
                // We need a listener to finish the selection
                var finish = function(event) {
                    // Don't trigger again
                    remove_tool_listener(stop_handle);
                    
                    // Also stop the dynamic updates. This removes the rectangle.
                    remove_tool_listener(move_handle);

                    // Store the end of the selection
                    var selection_end = event.latLng;
                    
                    print("Selection ended at " + selection_end);
                        
                    // Select the rectangle by arbitrary corners.
                    select_rectangle(selection_start, selection_end);    
                };
                
                // Attach the listener.
                // The listener can still use its own handle because variable 
                // references are resolved at runtime.
                var stop_handle = add_tool_listener("click", finish, function() {
                    // Cleanup: say this tool is no longer selected
                    oper.tool_selected = undefined;
                });
                
            }, function() {
                // Remove the crosshair cursor
                googlemap.setOptions({
                    draggableCursor: undefined
                });
            });
        });

    // A tool for importing a list of hexes as a selection
        add_tool("import", "Import", function() {
            // Make the import form
            var import_form = $("<form/>").attr("title", 
                "Import List As Selection");
            
            import_form.append($("<div/>").text("Input names, one per line:"));
            
            // A big text box
            var text_area = $("<textarea/>").addClass("import");
            import_form.append(text_area);
            
            import_form.append($("<div/>").text(
                "Open a file:"));
                
            // This holds a file form element
            var file_picker = $("<input/>").attr("type", "file").addClass("import");
            
            import_form.append(file_picker);
            
            file_picker.change(function(event) {
                // When a file is selected, read it in and populate the text box.
                
                // What file do we really want to read?
                var file = event.target.files[0];
                
                // Make a FileReader to read the file
                var reader = new FileReader();
                
                reader.onload = function(read_event) {  
                    // When we read with readAsText, we get a string. Just stuff it
                    // in the text box for the user to see.
                    text_area.text(reader.result);
                };
                
                // Read the file, and, when it comes in, stick it in the textbox.
                reader.readAsText(file);
            });
            
            import_form.dialog({
                dialogClass: 'dialog',
                modal: true,
                width: '20em',
                buttons: {
                    "Import": function() {
                        // Do the import of the data. The data in question is always
                        // in the textbox.
                        
                        // Select all the entered hexes
                        select_string(text_area.val());
                        
                        // Finally, close the dialog
                        $(this).dialog("close");
                        
                        // Done with the tool
                        oper.tool_selected = undefined;
                    }   
                },
                close: function() {
                    // They didn't want to use this tool.
                    oper.tool_selected = undefined;
                }
            });
        });

    // The actual text to selection import function used by that tool
    function select_string(string) {
        // Given a string of hex names, one per line, make a selection of all those
        // hexes.
        
        // This is an array of signature names entered.
        var to_select = [];
        
        // This holds the array of lines. Split on newlines (as seen in
        // jQuery.tsv.js)
        var lines = string.split(/\r?\n/);
        
        for(var i = 0; i < lines.length; i++) {
            // Trim and add to our requested selection
            to_select.push(lines[i].trim());
        }
        
        // Add a selection with as many of the requested hexes as actually exist and
        // pass the current filters.
        select_list(to_select);
    }

        // And a tool for exporting selections as lists of hexes
        add_tool("export", "Export", function() {
            // Make the export form
            var export_form = $("<form/>").attr("title", 
                "Export Selection As List");
            
            export_form.append($("<div/>").text("Select a selection to export:"));
            
            // Make a select box for picking from all selections.
            var select_box = $("<select/>");
            
            // Populate it with all existing selections
            for(var layer_name in layers) {
                if(layers[layer_name].selection) {
                    // This is a selection, so add it to the dropdown.
                    select_box.append($("<option/>").text(layer_name).attr("value",
                        layer_name));
                }
            }
            
            export_form.append(select_box);
            
            export_form.append($("<div/>").text("Exported data:"));
            
            // A big text box
            var text_area = $("<textarea/>").addClass("export");
            text_area.prop("readonly", true);
            export_form.append(text_area);
            
            // Add a download as file link. The "download" attribute makes the
            // browser save it, and the href data URI holds the data.
            var download_link = $("<a/>").attr("download", "selection.txt");
            download_link.attr("href", "data:text/plain;base64,");
            download_link.text("Download As Text");
            
            export_form.append(download_link);
            
            text_area.focus(function() {
                // Select all on focus.
                
                $(this).select();
            });
            
            text_area.mouseup(function(event) {
                // Don't change selection on mouseup. See
                // http://stackoverflow.com/a/5797700/402891 and
                // http://stackoverflow.com/q/3380458/402891
                event.preventDefault();
            });
            
            select_box.change(function() {
                // Update the text area with the list of hexes in the selected
                // layer.
                
                // Get the layer name.
                var layer_name = select_box.val();
                if(!have_layer(layer_name)) {
                    // Not a real layer.
                    // Probably just an empty select or something
                    return;
                }
                
                // This holds our list. We build it in a string so we can escape it
                // with one .text() call when adding it to the page.
                var exported = "";
                
                // Get the layer data to export
                var layer_data = layers[layer_name].data;
                for(var signature in layer_data) {
                    if(layer_data[signature]) {
                        // It's selected, put it in
                        
                        if(exported != "") {
                            // If there's already text, put a newline first.
                            exported += "\n";
                        }
                        
                        exported += signature;
                    }
                }
                
                // Now we know all the signatures from the selection, so tell the
                // page.
                text_area.text(exported);
                
                // Also fill in the data URI for saving. We use the handy
                // window.bota encoding function.
                download_link.attr("href", "data:text/plain;base64," + 
                    window.btoa(exported));
            });
            
            // Trigger the change event on the select box for the first selected
            // thing, if any.
            select_box.change();
            
            export_form.dialog({
                dialogClass: 'dialog',
                modal: true,
                width: '20em',
                buttons: {
                    "Done": function() {
                        // First, close the dialog
                        $(this).dialog("close");
                        
                        // Done with the tool
                        oper.tool_selected = undefined;
                    }   
                },
                close: function() {
                    // They didn't want to use this tool.
                    oper.tool_selected = undefined;
                }
            });
        });

        // Set up the link to this page control
        add_tool("link-to-page", "Link", function() {
            
            // We will provide the user with an alert box with the link to the
            // hexagrap visualization map.

            var link = (window.location.protocol + "//" + window.location.host 
                        + "/" + window.location.pathname);
            
            alert(link);
            oper.tool_selected = undefined;
         
        });

        /* TODO disable until it works
        // Set up the reset sort order to clumpiness scores, if present. Clears all
        // computed statistics p-values and r-values.
        add_tool("reset-sort", "Density Sort", function() {
            
            for(var layer_name in layers) {
                // Remove all stats values.
                delete layers[layer_name].r_value;
                delete layers[layer_name].p_value;
                delete layers[layer_name].mutual_information;
            }
            
            // Bring Back Clumpiness Statistics
            clumpiness_values(current_layout_index);

            // Re-sort and force the browse list to refresh.
            update_browse_ui();
            
            // Hide any "ranked against" caption
            $("#ranked-against").hide();
            
            oper.tool_selected = undefined;
        });
        */

        oper.selected_tool = undefined;
}
})(app);

