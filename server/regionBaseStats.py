#!/usr/bin/env python2.7
"""
regionBasedStats.py: Calculate the region-based-stats

"""
# TODO not all of these are needed
import sys, os, math, numpy, shutil, tempfile
import collections, multiprocessing, traceback, numpy, time, datetime, pprint
import scipy.stats, scipy.linalg, scipy.misc
import time
import os.path
import tsv, csv
import mutualInfo

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def window_tool(width, height, ctx, threshold=0, layout_index=0):
    """
    Given a width and height, this tool will seperate the 256 * 256 Google Map
    Grid into windows of equal size. Then we will construct a list
    that will represent the windows of the grid.
    We will iterate over each hexagram, looking at it's 
    x and y values. We will apply floor division (//) to the x & y values
    and observe the quotients, which will represent the row and column 
    in which the hexagram should be added. Then we will append this hex name
    to a list of hexes in its window.
    
    Returns a list of lists (one per window) of hexagon names for the hexagons
    in that window. This list depends only on the layout, and is the same for
    all layers (obviously).
    
    If the number of hexes in a window is less than the passed threshold, that
    window is not included in the returned list.
    
    By default, this function operates only on the first layout. layout_index
    can change this to other layouts.
    
    Break up of a 4 by 4 Grid:
    row 3 |12|13|14|15|      
    row 2 |8 |9 |10|11|     If the row, col pair returned by the // is for example 
    row 1 |4 |5 |6 |7 |     (3,2) - the appropriate window in the list would be given
    row 0 |0 |1 |2 |3 |     by row * numcols + col. In this case, 3*4 + 2 = 14
    """

    # Retrieve the hexagon names from the appropriate hexagon dictionary
    hex_values = ctx.all_hexagons[layout_index].values()
    #print ("Hex Values:", hex_values)
    hex_values_length = len(hex_values)

    # Retrieve all X and Y coordinates for these hexagons
    x_values = ctx.extract_coords (0, hex_values_length, ctx.all_hexagons[layout_index])
    y_values = ctx.extract_coords (1, hex_values_length, ctx.all_hexagons[layout_index])
     
    # defaultdict of lists containing spatially mapped hexagons, indexed by
    # (window row, window col) tuples.
    window_assignments = collections.defaultdict(list)
    
    # For each hexagon determine its window and place it in the appropriate list
    # Extract the appropriate x & y coordinate and determine the appropriate
    # row and colum numbers. Then use these to compute the correct index
    # in the window_assignments list.
    for index, hex_name in enumerate(hex_values):
        # What column is this hex's window?
        col = int(x_values[index]//width)
        # What row is this hex's window?
        row = int(y_values[index]//height)
        
        # Put the hex in the appropriate window.
        window_assignments[(row, col)].append(hex_name)

    # Curate the windows. If the number of samples in a window is less than
    # the threshold defined in window_tool's argument, discard the window
    curated_windows = []
    for window in window_assignments.itervalues():
        if len(window) >= threshold:
            curated_windows.append(window)

    print timestamp(), 'Windowing complete'

    i = 0
    for w in curated_windows:
        for col in range(25):
            val = len(w)
            if val > 0:
                i += 1
                print '(', row, ',', col, ')\t', val
    print "# of windows:", i
    print 'threshold:', threshold


    return curated_windows

def pearson_all_pairs(value_dict):
    # TODO if we want to break this into parallel tasks, this should be done as
    # in sampleBasedStats.py

    for layer_a in value_dict.iterkeys():

        for layer_b in value_dict.iterkeys():
            # Compute the pearson value with each other layer.
            # This gets done each way, since order matters here.
            # TODO the above is true for mutual information, but probably
            # not for pearson.

            # TODO do we want to do layers against themselves so they show
            # up in the sorted list for the user?
            if layer_a == layer_b:
                # Don't do layers against themselves. That would be silly.
                continue

            # Compute R Coefficient & P-Value. We want a sign, and we want the
            # p-value, so apply the sign of the R Coefficient to the P-Value
            pearson_val = scipy.stats.pearsonr(value_dict[layer_a], value_dict[layer_b])
            r_val = pearson_val[0]
            val = p_val = pearson_val[1]
            if r_val < 0:
                val = -1 * p_val

            # Yield the stats value. We want a sign, and we want the p-value, so
            # apply the sign of the r-value to the p-value

            yield (layer_a, layer_b, val)

def normalized_pearson_statistics(layers, layer_names, ctx, options):
    """
    For every binary layer and for every layout, we need a file called
    layer_<layer number>_<layout number>_region.tab with scores associating that
    layer with other layers of its type. This uses a normalized pearson 
    correlation to produce a score between -1 and 1, where -1 is the most 
    anticorrelated, 0 is no correlation and 1 is the most correlated.

    For binary data we're using a normalized pearson correlation that accounts
    for sample biases. We're using these logical steps to get there:
    
    1. Divide the screen into some number of windows (grid).

    2. Scan across every window and count the number of samples in that window,
       to create a vector of counts.
                i.e., with a toy 2 x 2 grid:
                C = [2, 1, 3, 5]

    3. Drop any windows from the vector that are below the lower_threshold.
                toy: with a lower_threshold of 2:
                C’ = [2, 3, 5]

    4. Normalize this vector. for each element:
        a. divide by the sum of the elements.
                toy: C’’ =  [1/5, 3/5, 1]
        b. multiply by the pseudocount of 5
                toy: C’’’ = [1, 3, 5]

    5. For attribute A, create a vector with counts of the number
       of samples in which attribute A is 1. Don’t include windows dropped
       from vector C.
                toy: A = [1, 2, 2]

    6. Do the same for attribute B.
                toy: B = [0, 1, 1]

    7. Compare vectors A and B. For each sample in a window that
       has a value of one for both A and B, decrement that window count
       in both vectors.
                toy: if the 2nd window has one sample that is in A & B:
                A’ = [1, 1, 2],  B’ = [0, 0, 1]

    8. For each element of A' and B’ add the corresponding element of C’’'.
                toy: A'' = [2, 4, 4],  B’’ = [1, 3, 6]

    9. Correlate vectors A and B with the Pearson method which returns an
        R correlation and a P—value.

    
    The coding steps to accomplish the above logical steps are:

    1. Using of a grid of windows over the map, with a height and width of W
       windows, place each hexagon in the appropriate window by location. The 
       hexagon names are stored as list for each window in a vector, C of W x W
       elements.
       toy: with W = 2, say C = [[hex5, hex3],
                                 [hex2],
                                 [hex11, hex17, hex9],
                                 [hex10, hex8, hex7, hex6, hex4]]

    2. For each window in C, build 3 new vectors, A & B for each of the two
       attributes, and C', a transformation of C. Set the value of a sum, S, to 0.
       (a) If the window has a hexagon count below the lower-threshold, ignore
           it and continue with the next iteration
       (b) Add an element to C' containing the hexagon count in the window and
           increment the sum by the count.
       (c) Look at the hexagons in the window, finding counts for attribute A
           & B with a value of one. If a hexagon has a value of one for both A
           & B, don't include it in the counts. Create an element in vectors A &
           B with their respective count.
       toy results: C' = [2, 3, 5], S = 10, and say A = [1, 2, 2], B = [0, 1, 1]

    3. Build a transformed vector for each of A & B. For each count in C':
       (a) Normalize the window count of this C' element, we'll call it c'':
           multiply by a psuedo count of 5 and divide by the sum, S, obtained
           above.
       (b) Add c'' to the corresponding element in each of A & B.
       toy results: A’ = [1, 1, 2],  B’ = [0, 0, 1]

    4. Correlate vectors A' and B' with the Pearson method which returns an
	   rho correlation and a P—value.

    For an adaptive grid, start with a 2 x 2 grid, a lower threshold, L, and an 
    upper threshold, U. Recursively for each window, starting at Layer = 0:
	(a) If count < L, ignore this window. Go to step (a) for the 
	    next window.
	(b) If count < U, put this count into vector C and go to step (a)
	    for the next window.
	(c) Create a new layer, n + 1, by splitting the window into 4 equal 	   
         windows & start at step (a) with the first new window.
	(d) If we are at the end of this layer of windows and in layer 0,
	    we have a complete background vector and we’re done.
	(e) If we are at the end of this layer, go to step (a) for the next
        window in the next higher layer.
	(f) Go to step (a) for the next window in this layer
    

    """

    if ctx.binary_layers == 0:
        print('No binary layers for region-based stats to process')
        return True

    # We're going to need a mapping from layer name to layer index.
    layer_indices = {name: i for i, name in enumerate(layer_names)}
    
    for layout_index in ctx.all_hexagons.iterkeys():
        # We look at all layouts for this.
        # We assume layout doesn't somehow change layer types.
        
        # Get windows in this layout. Doesn't really matter what order they're
        # in, since we only compare within layouts. Keep the threshold used
        # above.
        curated_windows = window_tool(
            options.mi_window_size,
            options.mi_window_size,
            ctx,
            threshold=options.mi_window_threshold,
            layout_index=layout_index
        )

        # Map windows with hexagon IDs to counts of hexagons in each window.
        windows_counts = map(lambda x: len(x), curated_windows)

        print 'windows_counts'
        for count in windows_counts:
            print count

        # Normalize the window counts: For each element, divide by the sum of
        # the window counts and multipy by a pseudocount of 5.
        some = sum(iter(windows_counts))
        norm_windows = map(lambda x: float(x) * 5 / some, windows_counts)

        # This will hold per-window discrete values for each layer for which we
        # are computing statistics. For binary layers, it is
        # the sum of the number of ones in the window. For non-binary layers, it
        # is the histogram bin number in which the window's average value falls,
        # or a past-the-last-bin number for an empty window with a NaN average.
        # This is indexed by layer name, referencing the window values for that
        # layer.
        layer_window_values = {}
       
        for layer_name in ctx.binary_layers:
        
            # For binary layers, get the sum for each window. But use 0 for
            # hexes that don't have values in a certain layer. Also
            # (re)discretize by binning as for continuous below.

            # This holds sums for this layer, for each window.
            window_sums = [
                (
                    int(sum(
                        (
                            layers[layer_name][hexagon]
                            if layers[layer_name].has_key(hexagon) else 0
                        )
                        for hexagon in window
                    ))
                )
                for window in curated_windows
            ]
            
            # Multiply the normalized window sums by this layer's sums
            for i in range(len(norm_windows)):
                window_sums[i] *= norm_windows[i]

            layer_window_values[layer_name] = window_sums

        pairs_to_run = len(layer_window_values) ** 2 - len(layer_window_values)  # without compare to self

        print timestamp(), pairs_to_run, "pairs to run from", len(curated_windows), 'windows out of', options.mi_window_size

        # What layer are we writing the file for?
        current_first_layer = None
        # Where are we writing it to?
        writer = None
        
        # How many pairs have we done?
        pair = 0

        # Loop through all the pairs, writing to the stats.file
        message_count = 1
        
        for (layer_a, layer_b, stat) in pearson_all_pairs(
            layer_window_values):

            # Go get the stats for each pair of layers, grouped by the
            # first layer.
            
            if layer_a != current_first_layer:
                # We're changing first layers.
                
                if writer is not None:
                    # Close the previous file.
                    writer.close()
                    
                # Open a tsv writer for the new first layer's correlations with
                # everyone else.
                writer = tsv.TsvWriter(open(os.path.join(
                    options.directory, 'layer_' + str(layer_indices[layer_a]) + '_rstats.tab'), 'w'))
                    
                # Record that we're on that layer as the first layer now.
                current_first_layer = layer_a
                
                
            # Make a line for the stat result with this other layer.
            writer.line(layer_b, str(stat))  # TODO add a newline ?
            
            pair += 1

            # Log a progress message for every ~1/30th of pairs processed
            if pair > pairs_to_run * message_count / 30:
                print timestamp(), str(message_count) + '/30 of', pairs_to_run, 'pairs'
                sys.stdout.flush()
                message_count += 1

        print timestamp(), "{} pairs processed".format(pair)
            
        if writer is not None:
                    # Close the last file.
                    writer.close()

def region_based_statistics(layers, layer_names, ctx, options):
    normalized_pearson_statistics(layers, layer_names, ctx, options)


