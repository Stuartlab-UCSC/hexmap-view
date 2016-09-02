#!/usr/bin/env python2.7
regionBasedStats_unused.py: Handle the mutual information stats

# We're saving this file that contains the logic for mutual information stats.
# For now we are going with a normalized pearson correlation.
#

# TODO not all of these are needed
import sys, os, math, numpy, shutil, tempfile
import collections, multiprocessing, traceback, numpy, time, datetime, pprint
import scipy.stats, scipy.linalg, scipy.misc
import time
import os.path
import tsv, csv
import mutualInfo

def mutual_information_statistics(layers, layer_names, ctx, options):
    """    
    For every binary or continuous layer and for every layout, we need a
    mi_<layer number>_<layout number>.tab file, with scores associating that
    layer with other layers of its type, in <other layer name>\t<score>
    format. This uses mutual information (really, normalized redundancy)
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
        curated_windows = window_tool(
            options.mi_window_size,
            options.mi_window_size,
            ctx,
            threshold=options.mi_window_threshold,
            layout_index=layout_index
        )

        # This will hold per-window discrete values for each layer for which we
        # are computing mutual information statistics. For binary layers, it is
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

            # This holds sums for each layer, for each window.
            window_sums = [
                sum (
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

            #print 'window_sums:', len(window_sums)
            #pprint.pprint(window_sums)

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
        pairs_to_run = len(layer_window_values) ** 2 - len(layer_window_values)  # without compare to self
        print timestamp(), "{} pairs to run".format(pairs_to_run)

        # What layer are we writing the file for?
        current_first_layer = None
        # Where are we writing it to?
        information_writer = None
        
        # How many pairs have we done?
        pair = 0

        #print('layer_window_values')
        #pprint.pprint(layer_window_values);

        message_count = 1
        
        for (layer_a, layer_b, redundancy) in mutualInfo.all_pairs (
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

            # Log a progress message for every ~1/30th of pairs processed
            if pair > pairs_to_run * message_count / 30:
                print timestamp(), str(message_count) + '/30 of', pairs_to_run, 'pairs'
                sys.stdout.flush()
                message_count += 1

        print timestamp(), "{} pairs processed".format(pair)
            
        if information_writer is not None:
                    # Close the last file.
                    information_writer.close()

