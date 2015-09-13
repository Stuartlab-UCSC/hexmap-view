#!/usr/bin/env python2.7
"""
regionBasedStats.py: Handle the region-based-stats.

This script takes in the filename of a tab-separated value file containing a
sparse similarity matrix (with string labels) and several matrices of
layer/score data. It produces an HTML file (and several support files) that
provide an interactive visualization of the items clustered on a hexagonal grid.

This script depends on the DrL graph layout package, binaries for which must be
present in your PATH.

Re-uses sample code and documentation from 
<http://users.soe.ucsc.edu/~karplus/bme205/f12/Scaffold.html>
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

def region_based_statistics(layers, layer_names, ctx, options):
    """    
    For every binary or continuous layer and for every layout, we need a
    mi_<layer number>_<layout number>.tab file, with scores associating that
    layer with other layers of its type, in <other layer name>\t<score>
    format. This uses mutual information (realy, normalized redundancy)
    instead of the statistical tests above to produce a score between 0 and 1,
    with higher being more mutual information.
    """
    
    # We're going to need a mapping from layer name to layer index.
    layer_indices = {name: i for i, name in enumerate(layer_names)}
    
    for layout_index in ctx.all_hexagons.iterkeys():
        # We look at all layouts for this.
        # We assume layout doesn't somehow change layer types.
        
        # Get windows in this layout. Doesn't really matter what order they're
        # in, since we only compare within layouts. Keep the threshold used
        # above.
        curated_windows = window_tool(options.mi_window_size, 
            options.mi_window_size, ctx, threshold=options.mi_window_threshold,
            layout_index=layout_index)
            
        # This will hold per-window discrete values for each layer for which we
        # are computing mutual information statistics. For binary layers, it is
        # the sum of the number of ones in the window. For non-binary layers, it
        # is the histogram bin number in which the window's average value falls,
        # or a past-the-last-bin number for an empty window with a NaN average.
        # This is indexed by layer name, to get a list of per-window values.
        layer_window_values = {}
       
        for layer_name in ctx.binary_layers:
        
            # For binary layers, get the sum for each window. But use 0 for
            # hexes that don't have values in a certain layer. Also
            # (re)discretize by binning as for continuous below.
            
            # This holds sums for each window.
            window_sums = [
                sum(
                    (
                        layers[layer_name][hexagon]
                        if layers[layer_name].has_key(hexagon) else 0
                    )
                    for hexagon in window
                )
                for window in curated_windows
            ]
            """
            window_sums = [sum((layers[layer_name][hexagon]
                if layers[layer_name].has_key(hexagon) else 0)
                for hexagon in window)
                for window in curated_windows]
            """

            print('curated_windows -------------')
            pprint.pprint(curated_windows)
            print('window_sums -------------')
            pprint.pprint(window_sums)

            if options.mi_binary_binning:
                # We want to bin counts
                
                # Now we have our list of the sum values for each window.
                # Histogram bin the non-NaN values. See
                # <https://gist.github.com/elsonidoq/4230222>
                _, bins = numpy.histogram(
                    [
                        total for total in window_sums
                        if not math.isnan(total)
                    ]
                )
                #_, bins = numpy.histogram([total for total in window_sums
                #    if not math.isnan(total)])

                # Work out the bin numbers for all the totals (NaN windows get the
                # past-the-end bin)
                layer_window_values[layer_name] = numpy.digitize(window_sums,
                    bins)
            else:
                # Don't bin counts.
                layer_window_values[layer_name] = window_sums
        """
        TODO skip continuous for now
        for layer_name in ctx.continuous_layers:
            
            # For continuous layers, get the average for each window, but
            # discretize using histogram bin number.
            
            # This holds averages for each window.
            window_averages = []          
                        
            for window in curated_windows:
                # Compute the sum of the layer in the window
                window_sum = 0
                # And the number of hexes with values involved
                window_values = 0
                
                for hexagon in window:
                    if layers[layer_name].has_key(hexagon):
                        # Sum up over all the hexagons in this window with
                        # values for this layer
                        window_sum += layers[layer_name][hexagon]
                        window_values += 1
                
                if window_values == 0:
                    # Can't take the average Use NaN
                    window_averages.append(float("NaN"))
                else:
                    # Use the average like we're supposed to
                    # TODO: do we need float() here?
                    window_averages.append(float(window_sum) / window_values)
                    
            # Now we have our list of the average values for each window.
            # Histogram bin the non-NaN values. See
            # <https://gist.github.com/elsonidoq/4230222>
            _, bins = numpy.histogram([average for average in window_averages 
                if not math.isnan(average)])
                
            # Work out the bin numbers for all the averages (NaN windows get the
            # past-the-end bin)
            layer_window_values[layer_name] = numpy.digitize(window_averages,
                bins)
        """
        # compare to self so it is included in the sort
        vals_to_process = len(layer_window_values) ** 2
        pairs_to_process = ((vals_to_process ** 2) + vals_to_process) / 2
        print timestamp(), pairs_to_process, "pairs to run"
        #print "{} pairs to run".format(len(layer_window_values) ** 2 -
            #len(layer_window_values)) # without compare to self # TODO remove

        # What layer are we writing the file for?
        current_first_layer = None
        # Where are we writing it to?
        information_writer = None
        
        # How many pairs have we done?
        pair = 0

        print('layer_window_values')
        pprint.pprint(layer_window_values);
        
        for (layer_a, layer_b, redundancy) in mutualInfo.all_pairs(
            layer_window_values):
            
            # Go get mutual information for each pair of layers, grouped by the
            # first layer.
            
            if layer_a != current_first_layer:
                # We're changing first layers.
                
                if information_writer is not None:
                    # Close the previous file.
                    information_writer.close()
                    
                # Open a tsv writer for the new first layer's redundancies with
                # everyone else.
                information_writer = tsv.TsvWriter(open(os.path.join(
                    options.directory, "mi_{}_{}.tab".format(layout_index, 
                    layer_indices[layer_a])), "w"))
                    
                # Record that we're on that layer as the first layer now.
                current_first_layer = layer_a
                
                
            # Make a line for redundancy with this other layer.
            information_writer.line(layer_b, str(redundancy))
            
            pair += 1
            
        ctx.timestamp();
        print("{} pairs processed".format(pair))
            
        if information_writer is not None:
                    # Close the last file.
                    information_writer.close()

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
    
    return curated_windows
