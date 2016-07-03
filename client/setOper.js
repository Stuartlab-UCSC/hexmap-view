// setOper.js
// Perform the set operations.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    compute_intersection = function (values, intersection_layer_names, name) {
        // A function that will take a list of layer names
        // that have been selected for the intersection utility.
        // Fetches the respective layers and list of tumor ids.
        // Then compares data elements of the same tumor id
        // between both layers. Adds these hexes to a new layer
        // for visualization
        
        with_layers (intersection_layer_names, function (intersection_layers) {
            //Array of signatures that intersect 
            var intersection_signatures = [];

            // Gather Tumor-ID Signatures.
            for (hex in polygons)
            {
                if (intersection_layers[0].data[hex] == values[0] && intersection_layers[1].data[hex] == values[1]){
                    intersection_signatures.push(hex);
                }		
            }

            // Store the recorded layer name or use the persistent store value
            var layer_name;
            if (name != undefined) {
                layer_name = select_list (intersection_signatures, "intersection", undefined, name, false);
            }
            else {
                layer_name = select_list (intersection_signatures, "intersection");
            }
            // Store current session info about the newly created attributes
            var recorded_set_attr = [];
            for (var i = 0; i < ctx.created_attr.length; i++) {
                var existing_name = ctx.created_attr[i].l_name;
                recorded_set_attr.push(existing_name);
            }
            if (layer_name in recorded_set_attr == false && layer_name != undefined){
                ctx.created_attr.push({"set":"intersection", 
                                                    "l_name":layer_name,
                                                    "layers":intersection_layer_names,
                                                    "val":values,
                                                    "keep": true
                                                    });
            }
        });
    }

    compute_union = function (values, union_layer_names, name) {
        // A function that will take a list of layer names
        // that have been selected for the union utility.
        // Fetches the respective layers and list of tumor ids.
        // Then compares data elements of the same tumor id
        // between both layers. Adds these hexes to a new layer
        // for visualization
        
        with_layers (union_layer_names, function (union_layers) {
            //Array of signatures 
            var union_signatures = [];
            // Gather Tumor-ID Signatures.
            for (hex in polygons)
            {
                // Union Function
                if (union_layers[0].data[hex] == values[0] || union_layers[1].data[hex] == values[1]){
                    union_signatures.push(hex);
                }		
            }

            // Store the recorded layer name or use the persistent store value
            if (name != undefined) {
                var layer_name = select_list (union_signatures, "union", undefined, name, false);
            }
            else {
                var layer_name = select_list (union_signatures, "union");
            }

            // Store current session info about the newly created attributes
            var recorded_set_attr = [];
            for (var i = 0; i < ctx.created_attr.length; i++) {
                var existing_name = ctx.created_attr[i].l_name;
                recorded_set_attr.push(existing_name);
            }
            if (layer_name in recorded_set_attr == false && layer_name != undefined){
                ctx.created_attr.push({"set":"union", 
                                                    "l_name":layer_name,
                                                    "layers":union_layer_names,
                                                    "val":values,
                                                    "keep": true
                                                    });
            }
        });
    }

    compute_set_difference = function (values, set_difference_layer_names, name) {
        // A function that will take a list of layer names
        // that have been selected for the set difference utility.
        // Fetches the respective layers and list of tumor ids.
        // Then compares data elements of the same tumor id
        // between both layers. Adds these hexes to a new layer
        // for visualization
        
        with_layers (set_difference_layer_names, function (set_difference_layers) {
            //Array of signatures  
            var set_difference_signatures = [];
        
            // Gather Tumor-ID Signatures.
            for (hex in polygons)
            {
                // Set Difference Function
                if (set_difference_layers[0].data[hex] == values[0] && 
                    set_difference_layers[1].data[hex] != values[1]){
                    set_difference_signatures.push(hex);
                }
            }

            // Store the recorded layer name or use the persistent store value
            var layer_name;
            if (name != undefined) {
                layer_name = select_list (set_difference_signatures, "set difference", undefined, name, false);
            }
            else {
                layer_name = select_list (set_difference_signatures, "set difference");
            }

            // Store current session info about the newly created attributes
            var recorded_set_attr = [];
            for (var i = 0; i < ctx.created_attr.length; i++) {
                var existing_name = ctx.created_attr[i].l_name;
                recorded_set_attr.push(existing_name);
            }
            if (layer_name in recorded_set_attr == false && layer_name != undefined){
                ctx.created_attr.push({"set":"set difference", 
                                                    "l_name":layer_name,
                                                    "layers":set_difference_layer_names,
                                                    "val":values,
                                                    "keep": true
                                                    });
            }
        });
    }

    compute_symmetric_difference = function (values, symmetric_difference_layer_names, name) {
        // A function that will take a list of layer names
        // that have been selected for the set difference utility.
        // Fetches the respective layers and list of tumor ids.
        // Then compares data elements of the same tumor id
        // between both layers. Adds these hexes to a new layer
        // for visualization

        with_layers (symmetric_difference_layer_names, function (symmetric_difference_layers) {
            //Array of signatures 
            var symmetric_difference_signatures = [];
        
            // Gather Tumor-ID Signatures.
            for (hex in polygons)
            {
                // Symmetric Difference Function
                if (symmetric_difference_layers[0].data[hex] == values[0] && 
                    symmetric_difference_layers[1].data[hex] != values[1]){
                    symmetric_difference_signatures.push(hex);
                }
                if (symmetric_difference_layers[0].data[hex] != values[0] &&
                    symmetric_difference_layers[1].data[hex] == values[1]){
                    symmetric_difference_signatures.push(hex);
                }
            }
            // Store the recorded layer name or use the persistent store value
            var layer_name;
            if (name != undefined) {
                layer_name = select_list (symmetric_difference_signatures, "symmetric difference", undefined, name, false);
            }
            else {
                layer_name = select_list (symmetric_difference_signatures, "symmetric difference");
            }

            // Store current session info about the newly created attributes
            var recorded_set_attr = [];
            for (var i = 0; i < ctx.created_attr.length; i++) {
                var existing_name = ctx.created_attr[i].l_name;
                recorded_set_attr.push(existing_name);
            }
            if (layer_name in recorded_set_attr == false && layer_name != undefined){
                ctx.created_attr.push({"set":"symmetric difference", 
                                                    "l_name":layer_name,
                                                    "layers":symmetric_difference_layer_names,
                                                    "val":values,
                                                    "keep": true
                                                    });
            }
        });
    }

    compute_absolute_complement = function (values, absolute_complement_layer_names, name) {
        // A function that will take a list of layer names
        // that have been selected for the set difference utility.
        // Fetches the respective layers and list of tumor ids.
        // Then compares data elements of the same tumor id
        // between both layers. Adds these hexes to a new layer
        // for visualization

        with_layers (absolute_complement_layer_names, function (absolute_complement_layers) {
            //Array of signatures 
            var absolute_complement_signatures = [];
        
            // Gather Tumor-ID Signatures.
            for (hex in polygons)
            {
                // Absolute Complement Function
                if (absolute_complement_layers[0].data[hex] != values[0]) {
                    absolute_complement_signatures.push(hex);
                }
            }
        
            // Store the recorded layer name or use the persistent store value
            var layer_name;
            if (name != undefined) {
                layer_name = select_list (absolute_complement_signatures, "absolute complement", undefined, name, false);
            }
            else {
                layer_name = select_list (absolute_complement_signatures, "absolute complement");
            }

            // Store current session info about the newly created attributes
            var recorded_set_attr = [];
            for (var i = 0; i < ctx.created_attr.length; i++) {
                var existing_name = ctx.created_attr[i].l_name;
                recorded_set_attr.push(existing_name);
            }
            if (layer_name in recorded_set_attr == false && layer_name != undefined){
                ctx.created_attr.push({"set":"absolute complement", 
                                                "l_name":layer_name,
                                                "layers":absolute_complement_layer_names,
                                                "val":values,
                                                "keep": true
                                                });
            }
        });
    }
})(app);
