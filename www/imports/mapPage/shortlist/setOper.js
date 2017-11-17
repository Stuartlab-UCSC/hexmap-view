// setOperUI.js
// Handle the UI for the set operations.

import hexagram from '/imports/mapPage/viewport/hexagram.js';
import Layer from '/imports/mapPage/longlist/Layer.js';
import tool from '/imports/mapPage/head/tool.js';
import util from '/imports/common/util.js';

import './setOper.html';
import './setOper.css';

// Boolean stating whether this is the first time the set operation popup & stats query
// has been created so that "Select Layer" Default is added only once
var first_opening = true;

// Records number of set-operation clicks
var set_operation_clicks = 0;

// Hack: Keep global variable to tell when load session computation is complete
var set_operation_complete = false;


var set_types = [
    'na',
    'intersection',
    'union',
    'set difference',
    'symmetric difference',
    'cartesian product',
    'absolute complement',
];

function find_decoded_value (layer_name, layer, node) {

    // Find the decoded value which is the category name if categorical,
    // otherwise the value given in the layer.
    var decoded_val,
        codedVal = layer.data[node],
        colormap = colormaps[layer_name];
    if (colormap.length) {
        decoded_val = colormap[codedVal].name;
    } else {
        decoded_val = codedVal;
    }
    return decoded_val;
}

function compute_now (values, layer_names, set_type) {

    // A function that will take a list of layer names that have been
    // selected for a set operation. Fetches the respective layers and list
    // of node ids. Then compares data elements of the same node id between
    // both layers. Adds these hexes to a new layer for visualization
    // @param: values: values used to select nodes to include in the operation
    // @param: layer_names: the layer names to use in this set operation
    // @param: set_type: the set operation to perform
    //

    Layer.with_many (layer_names, function (set_layers) {
        //Array of signatures 
        var nodeIds = [],
            nodeVals = [];

        // Gather the resulting node IDs using the given set operation
        for (hex in polygons) {
            if (set_type === 'intersection') {
                if (set_layers[0].data[hex] === values[0]
                        && set_layers[1].data[hex] === values[1]) {
                    nodeIds.push(hex);
                }

            } else if (set_type === 'union') {
                if (set_layers[0].data[hex] === values[0]
                        || set_layers[1].data[hex] === values[1]) {
                    nodeIds.push(hex);
                }

            } else if (set_type === 'set difference') {
                if (set_layers[0].data[hex] === values[0]
                        && set_layers[1].data[hex] !== values[1]) {
                    nodeIds.push(hex);
                }
            
            } else if (set_type === 'symmetric difference') {
                // TODO test
                if (set_layers[0].data[hex] === values[0]
                        && set_layers[1].data[hex] !== values[1]) {
                    nodeIds.push(hex);
                }
                if (set_layers[0].data[hex] !== values[0]
                      && set_layers[1].data[hex] === values[1]){
                    nodeIds.push(hex);
                }

            } else if (set_type === 'absolute complement') {
                if (set_layers[0].data[hex] !== values[0]) {
                    nodeIds.push(hex);
                }
            } else if (set_type === 'cartesian product') {
                
                // Include NA values as an additional category
                nodeIds.push(hex);
                
                // Build the first part of the category name
                var val = '';
                if (_.isUndefined(set_layers[0].data[hex])) {
                    val = 'NA , ';
                } else {
                    var decoded_val = find_decoded_value(
                        layer_names[0], set_layers[0], hex);
                    val = decoded_val + ', ';
                }

                // Build the second part of the category name
                if (_.isUndefined(set_layers[1].data[hex])) {
                    val += 'NA';
                } else {
                    decoded_val = find_decoded_value(
                        layer_names[1], set_layers[1], hex);
                    val += decoded_val;
                }
                nodeVals.push(val);
            }
        }

        // Create a default label for this dynamic layer
        // TODO add the values to the suggested layer name.
        var new_layer_name;
        if (set_type === 'intersection') {
            new_layer_name = layer_names[0] + ' n ' + layer_names[1];

        } else if (set_type === 'union') {
            new_layer_name = layer_names[0] + ' U ' + layer_names[1];

        } else if (set_type === 'set difference') {

            new_layer_name = "In " + layer_names[0] + ' but not in ' + layer_names[1];
        
        } else if (set_type === 'symmetric difference') {
            new_layer_name = layer_names[0] + ' ∆ ' + layer_names[1];

        } else if (set_type === 'cartesian product') {
            new_layer_name = layer_names[0] + ' X ' + layer_names[1];

        } else if (set_type === 'absolute complement') {
            new_layer_name = 'Not: ' + layer_names[0];
        }
    
        // Add this new layer to the shortlist
        if (set_type === 'cartesian product') {
            Layer.create_dynamic_category(nodeIds, nodeVals, new_layer_name);
        } else {
            var layer_name = Layer.create_dynamic_selection(
                nodeIds, new_layer_name);
        }
    });
}

function compute_button_clicked () {
    var layer_names = [];
    var layer_values = [];

    // First layer name and values
    var drop_down_layers = document.getElementsByClassName("set-operation-value");
    var drop_down_data_values = document.getElementsByClassName("set-operation-layer-value");

    // Set operation
    var function_type = document.getElementById("set-operations-list");
    var selected_function = function_type.selectedIndex;

    var selected_index = drop_down_layers[0].selectedIndex;
    layer_names.push(drop_down_layers[0].options[selected_index].text);	

    var selected_index = drop_down_data_values[0].selectedIndex;
    layer_values.push(Number(drop_down_data_values[0].options[selected_index].value));

    // Second layer name and values
    if (selected_function != 6) {
        var selected_index = drop_down_data_values[1].selectedIndex;
        layer_values.push(Number(drop_down_data_values[1].options[selected_index].value));
        var selected_index = drop_down_layers[1].selectedIndex;
        layer_names.push(drop_down_layers[1].options[selected_index].text);
    }

    compute_now(layer_values, layer_names, set_types[selected_function]);

    reset();
};

// Set Operation GUI
function get_set_operation_selection () {
    // For the new drop-down GUI for set operation selection
    // we need a function to determine which set operation is selected.
    // This way we can display the appropriate divs.	
    
    // Drop Down List & Index for Selected Element
    var drop_down = document.getElementById("set-operations-list");
    var index = drop_down.selectedIndex;
    var selection = drop_down.options[index];
    
    return selection;	
}

function show_set_operation_window () {

    // Show Set Operation window
    $(".set-operation.dropdown").show();

}

function hide_window () {

    // Hide Set Operation Window
    $(".set-operation.dropdown").hide();

    var drop_downs = document.getElementsByClassName("set-operation-value");
    for (var i = 0; i < drop_downs.length; i++) {
        drop_downs[i].style.visibility="hidden";
    }

    // Hide the Data Values for the Selected Layers
    var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");
    for (var i = 0; i < drop_downs_layer_values.length; i++) {
        drop_downs_layer_values[i].style.visibility="hidden";
    }

    // Hide the Compute Button
    var compute_button = document.getElementsByClassName("compute-button");
    compute_button[0].style.visibility = "hidden";

    // Set the "Select Layer" drop down to the default value
    var list = document.getElementById("set-operations-list");
    list.selectedIndex = 0;
    
    var list_value = document.getElementsByClassName("set-operation-value");
    list_value[0].selectedIndex = 0;
    list_value[1].selectedIndex = 0;

    // Remove all elements from drop downs holding the data values for the 
    // selected layers. This way there are no values presented when the user
    // clicks on the set operation button to open it again.
    var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");
    var length = set_operation_layer_values[0].options.length;
    do{
        set_operation_layer_values[0].remove(0);
        length--;		
    }
    while (length > 0);

    var length = set_operation_layer_values[1].options.length;
    do{
        set_operation_layer_values[1].remove(0);
        length--;		
    }
    while (length > 0);
    
}

function create_set_operation_ui () {
    // Returns a Jquery element that is then prepended to the existing 
    // set operation window

    // This holds the root element for this set operation UI 
    var root = $("<div/>").addClass("set-operation-entry");
    
    // Add Drop Downs to hold the selected layers and and selected data values 
    var set_theory_value1 = $("<select/>").addClass("set-operation-value");
    var set_theory_layer_value1 = $("<select/>").addClass("set-operation-layer-value");
    var set_theory_value2 = $("<select/>").addClass("set-operation-value");	
    var set_theory_layer_value2 = $("<select/>").addClass("set-operation-layer-value");

    var compute_button = $("<input/>").attr("type", "button");
    compute_button.addClass ("compute-button");

    // Append to Root
    root.append (set_theory_value1);
    root.append (set_theory_layer_value1);
    root.append (set_theory_value2);
    root.append (set_theory_layer_value2);
    root.append (compute_button);

    return root;
}

exports.update_drop_down = function () {
    // The set operator changed to update the layer drop downs.
    //
    // This is the onchange command for the drop down displaying the 
    // different set operation functions. It is called whenever the user changes
    // the selected set operation.

    // Get the value of the set operator selection made by the user.
    var selection = get_set_operation_selection();
    var value = selection.value;

    // Check if the operator value is valid.
    if (selection.value > 0 && selection.value < 7){

            // Style the layer drop downs and layer value drop downs.
            var drop_downs = document.getElementsByClassName("set-operation-value");
            var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");

            for (var i = 0; i < drop_downs.length; i++) {
                drop_downs[i].style.visibility="visible";
            }
            
            for (var i = 0; i < drop_downs_layer_values.length; i++) {
                drop_downs_layer_values[i].style.visibility="visible";
            }

            var compute_button = document.getElementsByClassName("compute-button");
            compute_button[0].style.visibility = "visible";
            compute_button[0].value = "Compute Set Operation";

            if (first_opening == true) {

                // Set the default value for the layer drop downs
                var default_value = document.createElement("option");
                default_value.text = "Select Attribute 1";
                default_value.value = 0;
                drop_downs[0].add(default_value);

                var default_value2 = document.createElement("option");
                default_value2.text = "Select Attribute 2";
                default_value2.value = 0;
                drop_downs[1].add(default_value2);
                
                // Prevent from adding the default value again
                first_opening = false;
            }

            // Hide the layer value drop downs if the operator is
            // cartesian product.
            if (selection.value == 5) {
                drop_downs_layer_values[0].style.visibility="hidden";
                drop_downs_layer_values[1].style.visibility="hidden";
            }

            // Hide the second layer drop downs if the operator is "Not:".
            if (selection.value == 6) {
                drop_downs[1].style.visibility="hidden";
                drop_downs_layer_values[1].style.visibility="hidden";
            }
    }	
    else {
        // If the user has the default value selected, hide all drop downs
        var drop_downs = document.getElementsByClassName("set-operation-value");
        for (var i = 0; i < drop_downs.length; i++) {
            drop_downs[i].style.visibility="hidden";
        }
        var drop_downs_layer_values = document.getElementsByClassName("set-operation-layer-value");
        for (var i = 0; i < drop_downs_layer_values.length; i++) {
                drop_downs_layer_values[i].style.visibility="hidden";
        }
        var compute_button = document.getElementsByClassName("compute-button");
            compute_button[0].style.visibility = "hidden";
    }
}

function update_layer_selectors () {
    // This function is called when the shortlist is changed.
    // It appropriately updates the drop down containing the list of layers
    // to match the layers found in the shortlist.

    // Get a list of all drop downs that contain layer names
    var drop_downs = document.getElementsByClassName("set-operation-value");

    // Remove all existing layer names from both dropdowns
    var length = drop_downs[0].options.length;
    do{
        drop_downs[0].remove(0);
        length--;		
    }
    while (length > 0);
    var length = drop_downs[1].options.length;
    do{
        drop_downs[1].remove(0);
        length--;		
    }
    while (length > 0);

    // Add the default values that were stripped in the last step.
    var default_value = document.createElement("option");
    default_value.text = "Select Attribute 1";
    default_value.value = 0;
    drop_downs[0].add(default_value);

    var default_value2 = document.createElement("option");
    default_value2.text = "Select Attribute 2";
    default_value2.value = 0;
    drop_downs[1].add(default_value2);
    
    first_opening = false;
    
    // Add the layer names from the shortlist to the drop downs that store
    // layer names.
    var shortlist = Session.get('shortlist');
    for (var i = 0; i < drop_downs.length; i++){
        for (var j = 0; j < shortlist.length; j++) {
            if (!util.is_continuous(shortlist[j])) {
                var option = document.createElement("option");
                option.text = shortlist[j];
                option.value = j+1;
                drop_downs[i].add(option);
            }
        }
    }

    // Remove all elements from drop downs holding the data values for the 
    // selected layers. This way there are no values presented when the user
    // clicks on the set operation button to open it again.
    var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");
    var length = set_operation_layer_values[0].options.length;
    do{
        set_operation_layer_values[0].remove(0);
        length--;		
    }
    while (length > 0);

    var length = set_operation_layer_values[1].options.length;
    do{
        set_operation_layer_values[1].remove(0);
        length--;		
    }
    while (length > 0);

    // Call the function containing onchange commands for these dropdowns.
    // This way the data values are updated according the the selected layer.
    define_layer_selection_handlers ();
}

function define_layer_selection_handlers () {
    // Define the onchange commands for the drop downs that hold layer names.
    // This way the data values are updated according the the selected layer.

    // Get all drop down elements
    var selected_function = document.getElementById ("set-operations-list");
    var drop_downs = document.getElementsByClassName("set-operation-value");
    var set_operation_layer_values = document.getElementsByClassName("set-operation-layer-value");

    // The "Select Layer1" Dropdown onchange function
    drop_downs[0].onchange = function(){
        // Strip current values of the data value dropdown
        var length = set_operation_layer_values[0].options.length;
        do{
            set_operation_layer_values[0].remove(0);
            length--;		
        }
        while (length > 0);
    
        // Add the data values depending on the selected layer
        var selectedIndex = drop_downs[0].selectedIndex;
        var layer_name = drop_downs[0].options[selectedIndex].text;
        var set_operation_data_value_select = set_operation_layer_values[0];
        create_layer_selectors(set_operation_data_value_select, layer_name);
    };

    // The "Select Layer2" Dropdown onchange function
    drop_downs[1].onchange = function(){
        // Strip current values of the data value dropdown
        var length = set_operation_layer_values[1].options.length;
        do{
            set_operation_layer_values[1].remove(0);
            length--;		
        }
        while (length > 0);

        // Add the data values depending on the selected layer
        var selectedIndex = drop_downs[1].selectedIndex;
        var layer_name = drop_downs[1].options[selectedIndex].text;
        var set_operation_data_value_select = set_operation_layer_values[1];
        create_layer_selectors(set_operation_data_value_select, layer_name);
    };

}

function create_layer_selectors(value,layer_object) {

    // Create a link to the methods
    tool.add("methods", function(ev) {
        if (!$(ev.target).hasClass('disabled')) {
            $('.gridPage').click();    // TODO  ???
            tool.activity(false);
        }
    }, 'Map of nodes before final layout');

    // We must create a drop down containing the data values for the selected
    // layer.

    // The Javascript "select" element that contains the data values
    // is passed as "value" and the selected layer is passed as "layer_object". 

    // First, figure out what kind of filter settings we take based on 
    // what kind of layer we are.
    Layer.with_one(layer_object, function(layer) {
                    
             // No options available. We have to add them.
             for(var i = 0; i < layer.magnitude + 1; i++) {
                // Make an option for each value;
                var option = document.createElement("option");
                option.value = i;
                            
                if(colormaps[layer_object].hasOwnProperty(i)) {
                    // We have a real name for this value
                    option.text = (colormaps[layer_object][i].name);
                 } else {
                     // No name. Use the number.
                     option.text = i;
                     }  
                 value.add(option);
     
                 // Select the last option, so that 1 on 0/1 layers will 
                 // be selected by default.
                 var last_index = value.options.length - 1;
                 value.selectedIndex = last_index;   
                }                
     });
}

function reset () {
        hide_window ();
        set_operation_clicks = 0;
}

exports.init = function () {

    // Create Pop-Up UI for Set Operations
    $("#set-operations").prepend(create_set_operation_ui ());

    // Update Values for GUI Dropdowns
    update_layer_selectors ();

    // Hide other functions so that if one is visible, 
    // it disappears from sight. Reset the set operation counter so that 
    // if the user clicks on the function icon it will open immediately
    hide_window ();
    set_operation_clicks = 0;

    // Action handler for display of set operation pop-up
    $("#set-operation").button().click(function() {
        set_operation_clicks++;

        // Hide other functions so that if one is visible, 
        // it disappears from sight. Reset the set operation counter so that 
        // if the user clicks on the function icon it will open immediately
        if (set_operation_clicks % 2 != 0){
                show_set_operation_window ();
                // Update so that there are no repeated "Select" Attrributes
                update_layer_selectors ();
            }
        else {
            hide_window ();
        }		
    
    });

    // Create a link from the navBar
    tool.add("setOperations", function(ev) {
        $('#set-operation').click();
        tool.activity(false);
    }, 'Calculate set operation');
    
    $('#set-operations-list').on('change', exports.update_drop_down);
    $('.set-operation .cancel').on('click', reset);
    
    var compute_button = document.getElementsByClassName ("compute-button");
    compute_button[0].onclick = compute_button_clicked;
}
