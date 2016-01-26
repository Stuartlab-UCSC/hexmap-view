// legend.js
// Handle the legend.

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line

    // How big is our color key in pixels?
    var KEY_WT = 125,
        RANGE_HT = KEY_WT,
        IDEAL_ROW_HT = 32,
        MAX_LABEL_HT = 14,
        key_ht;

    function horizontalBandLabels (colormap, context) {

        // We have a layer with horizontal bands
        // Add labels to the key if we have names to use.
        // TODO: Vertical text for vertical bands?
    
        // Actually have any categories (not auto-generated)
        print("Drawing key text for " + colormap.length + " categories.");
        
        // How many pixels do we get per label, vertically
        var label_space_height = key_ht / colormap.length,
            label_height = Math.min(label_space_height, MAX_LABEL_HT);

        // Configure for text drawing
        context.font = label_height + "px Arial";
        context.textBaseline = "middle";

        for (var i = 0; i < colormap.length; i++) {
            
            // This holds the pixel position where our text goes
            var y_position = key_ht - (i + 1) * label_space_height
                    + label_space_height / 2,

                // Get the background color here as a 1x1 ImageData
                image = context.getImageData(0, y_position, 1, 1),
            
                // Make a Color so we can operate on it
                background_color = Color({
                    r: image.data[0],
                    g: image.data[1],
                    b: image.data[2]
                });

            // Do we want white or black text?
            var fontColor = 'white';
            if(background_color.light()) {
                fontColor = 'black';
            }
            context.fillStyle = fontColor;

            // Draw the name on the canvas
            context.fillText(colormap[i].name, 2, y_position);
        }
    }

    redraw_legend = function (retrieved_layers, current_layers) {

        // Draw the color key.
        if(retrieved_layers.length == 0) {

            // No color key to draw
            $(".key").hide();
            return;
        }

        // We do actually want the color key
        $(".key").show();

        var keyOffsetTop = $('.key').offset().top,
            windowHt = $(window).height(),
            max_key_ht = windowHt - keyOffsetTop - 160,
            ideal_key_ht,
            colormap0,
            colormap1,
            colorCount0;

        // Get the vertical colormap
        if (have_colormap(current_layers[0])) {
            colormap0 = colormaps[current_layers[0]];
            if (colormap0.length > 0) {
                colorCount0 = colormap0.length;
            } else {
                colorCount0 = 0;
            }

            // Determine the key height
            if (colorCount0 > 0) {
                var ideal_key_ht = IDEAL_ROW_HT * colorCount0,
                    max_key_ht = windowHt - keyOffsetTop - 160;
                key_ht = Math.min(ideal_key_ht, max_key_ht);

            } else {

                // A binary layer
                key_ht = IDEAL_ROW_HT * 2;
            }
        } else {

            // A continuous layer
            key_ht = RANGE_HT;
        }

        // Get the horizontal colormap
        if (have_colormap(current_layers[1])) {
            colormap1 = colormaps[current_layers[1]];
            if (colormap1.length > 0) {
                colorCount1 = colormap1.length;
            } else {
                colorCount1 = 0;
            }
        }

        // Adjust DOM elements dependent on key height
        $('.key').height(key_ht + 50);  // container is 50px taller than color key
        $('#x-axis').css('top', key_ht + 55);

        // We need to replace the canvas to apply a new height for the 2D context
        $('#color-key').addClass('old');
        var newCanvas = $('<canvas id="color-key" width="' + KEY_WT + '" height="' + key_ht + '"/>');
        $('#color-key.old')
            .after(newCanvas)
            .remove();

        // This holds the canvas that the key gets drawn in
        var canvas = $("#color-key")[0];
        
        // This holds the 2d rendering context
        var context = canvas.getContext("2d");

        for(var i = 0; i < KEY_WT; i++) {

            // We'll use i for the v coordinate (-1 to 1) (left to right)
            var v = 0;
            if(retrieved_layers.length >= 2) {
                v = i / (KEY_WT / 2) - 1;
                if(have_colormap(current_layers[1])) {

                    // This is a color map, so do bands instead. Make sure
                    // there are at least 2 bands.
                    v = Math.floor(i / KEY_WT * 
                        Math.max(colorCount1, 2));
                }
                
            }

            for(var j = 0; j < key_ht; j++) {

                // And j specifies the u coordinate (bottom to top)
                var u = 0;
                if(retrieved_layers.length >= 1) {
                    u = 1 - j / (key_ht / 2);
                    if(have_colormap(current_layers[0])) {

                        // This is a color map, so do bands instead. Make
                        // sure there are at least 2 bands. Also make sure
                        // to flip sign, and have a -1 for the 0-based
                        // indexing.
                        u = Math.floor((key_ht - j - 1) / key_ht * 
                            Math.max(colorCount0, 2));
                    }
                }
                
                // Set the pixel color to the right thing for this u, v
                // It's OK to pass undefined names here for layers.
                context.fillStyle = get_color(current_layers[0], u, 
                    current_layers[1], v);
                
                // Fill the pixel
                context.fillRect(i, j, 1, 1);
            }
        }
    
        if (have_colormap(current_layers[0])) {

            if (colorCount0 > 0) {
                horizontalBandLabels(colormap0, context);
            }
        }
        
        // We should also set up axis labels on the color key.
        // We need to know about colormaps to do this
        
        // Hide all the labels
        $(".label").hide();
        
        if(current_layers.length > 0) {

            // Show the y axis label
            $("#y-axis").text(current_layers[0]).show();
            
            if(!have_colormap(current_layers[0])) {

                // Show the low to high markers for continuous values
                $("#low-both").show();
                $("#high-y").show();
            }
        }
        
        if(current_layers.length > 1) {

            // Show the x axis label
            $("#x-axis").text(current_layers[1]).show();
            
            if(!have_colormap(current_layers[1])) {

                // Show the low to high markers for continuous values
                $("#low-both").show();
                $("#high-x").show();
            }
        }
    }

    initLegend = function () {

        // Resize the legend along with the window
        $(window).resize(function () {
            current_layers = get_current_layers();
            with_layers(current_layers, function(retrieved_layers) {
                redraw_legend(retrieved_layers, current_layers);
            });
        });
    }
})(app);
