#!/usr/bin/env python2.7
"""
regionBasedStats.py: Calculate the region-based-stats

"""
# TODO not all of these are needed
import sys, os, math, numpy, shutil, tempfile
import collections, multiprocessing, traceback, numpy, time, datetime, pprint
import scipy.stats, scipy.linalg, scipy.misc
import time, copy
import os.path
import tsv, csv
import mutualInfo

PSEUDOCOUNT = 5

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def window_tool(ctx, directory, nodes_raw, lowerT, upperT, layoutIndex):
    """
    Given a list of nodes, this tool will create a 2 x 2 grid containing 4
    windows of equal size. We will iterate over each node, looking at it's x &
    y values. We will apply floor division (//) to the x & y values and observe
    the quotients, which will represent the row and column in which the node
    should be added. Then we will append this node name to a list of nodes in 
    its window.
    
    Any windows with a node count below the lower threshold will be ignored and
    not included in the curated windows.

    Any windows with a node count above the upper threshold will be recursively
    divided into a 4-window grid until the inner window node count is lower
    than the upper threshold.
    
    Returns the curated windows as a list of lists (one per window) of node 
    names of the nodes in that window.
    """

    print timestamp(), 'Windowing starting...'
    sys.stdout.flush()

    # Find the extents of the nodes
    minX = maxX = minY = maxY = None
    for name, coord in nodes_raw.iteritems():
        if minX is None:
            minX = maxX = coord[0]
            minY = maxY = coord[1]
        else:
            minX = min(minX, coord[0])
            maxX = max(maxX, coord[0])
            minY = min(minY, coord[1])
            maxY = max(maxY, coord[1])

    # Find the maximum extent, and normalize each node by shifting it to the
    # origin (0, 0).
    nodes = {}
    for name, coord in nodes_raw.iteritems():
        nodes[name] = (coord[0] - minX, coord[1] - minY)

    hex_count = len(nodes.keys())

    # Open the file for the grid to be written
    filename = os.path.join(directory, 'grid_' + str(layoutIndex) + '.tab')
    fOutFile = open(filename, 'w')
    fOut = csv.writer(fOutFile, delimiter='\t')

    # Write the bounds of the outer-most grid
    G = max((maxX - minX), (maxY - minY))
    W = G / 2
    fOut.writerow([0, 0, G, 0])
    fOut.writerow([0, 0, 0, G])
    fOut.writerow([G, G, G, 0])
    fOut.writerow([G, G, 0, G])

    # Initialize the array where we store windows with node counts
    # between the lower and upper thresholds
    curated = []

    def window_level(minX, minY, W):
        """
        This collects node names belonging to a 2 x 2 grid of 4 windows, with a
        window lengths of W. minX and minY are the minimum coordinates of the 
        grid.
        """
        # Write the grid for this level
        midX = minX + W
        midY = minY + W
        row = [minX, midY, minX + W * 2, midY]
        fOut.writerow(row)
        row = [midX, minY, midX, minY + W * 2]
        fOut.writerow(row)

        # Initialize windows as a defaultdict of 4 lists containing nodes mapped
        # to each window. Indexed by (window_row, window_col) tuples of:
        #   (0,0), (1,0) (1,1), (0,1)
        windows = collections.defaultdict(list)

        # Assign each node to the appropriate window. Use the x & y coordinate
        # to determine the appropriate row and colum, which is used as the index
        # into the window.
        for name, coord in nodes.iteritems():
            col = int((coord[0] - minX) // W)
            row = int((coord[1] - minY) // W)
            if col > -1 and col <= 2 and row > -1 and row <= 2:
                windows[(row, col)].append(name)

        # We now have between 1 and 4 windows; there will not be a window if
        # no nodes belong to it. Using the thresholds, determine which windows
        # to toss, which to keep, and which to divide further.
        divide = []
        for widx, names in windows.iteritems():
            len_names = len(names)

            # For a window whose node count is above the upper threshold,
            # we want to divide further.
            if len_names > upperT:
                divide.append(widx)
            else:
                # Remove the nodes for consideration in further divisions
                for name in names:
                    try:
                        del nodes[name]
                    except:
                        print 'Warning: node was already removed:', name

                # For window counts above the lower threshold,
                # save to the curated list
                if len_names >= lowerT:
                    curated.append(names)

        # Recurse through any windows with too many nodes by dividing the window
        # into 4 new windows
        W /= 2
        for widx in divide:

            # Determine the new minimums and recurse. Window indices start at
            # the origin in the upper left window and go clockwise.
            if widx == (0, 0):
                window_level(minX, minY, W)
            elif widx == (1, 0):
                window_level(minX+W, minY, W)
            elif widx == (1, 1):
                window_level(minX+W, minY+W, W)
            else: # (0, 1)
                window_level(minX, minY+W, W)

    # Start up the adaptive windowing by passing the origin and window length to
    # the recursive routine.
    window_level(0, 0, W)

    fOutFile.close()

    if len(nodes.keys()) > 0:
        print 'Warning: nodes that were not assigned to a window:', nodes

    print timestamp(), 'Windowing complete'

    return curated

def pearson_all_pairs(layerPairs):
    """
    layerPairs are in the format:
        [
            [
                layerNameA,
                layerNameB,
                [c1, c2, c3],
                [c4, c4, c5],
            ]
            ...
        ]
    """
    for pair in layerPairs:

        # Compute the pearson value with each other layer.
        # This gets done each way, since order matters here.

        # Compute R Coefficient & P-Value. We want a sign, and we want the
        # p-value, so apply the sign of the R Coefficient to the P-Value
        pearson_val = scipy.stats.pearsonr(pair[2], pair[3])
        r_val = pearson_val[0]
        val = p_val = pearson_val[1]
        if r_val < 0:
            val = -1 * p_val

        # Yield the stats value
        yield (pair[0], pair[1], val)


def buildLayerPairs(statsLayers, layers, C, C2):
    # Build the layer pairs given:
    # @param statsLayers: layer names to include in the pair
    # @param layers: all the information we need for every layer
    # @param C: array of node names in each window
    # @param C2: array of values to be added to each member in A & B
    # A & B will have the same length as C2 and C, and will include the
    # normalized node counts for each attribute

    # Initialize the layerPairs
    layerPairs = []

    # Build a vector for each attribute containing counts for each window
    for layerA in statsLayers:

        for layerB in statsLayers:
            if layerA == layerB:
                continue

            # Initialize the counts for the layers to the additives in C2
            A = copy.copy(C2)
            B = copy.copy(C2)

            # Find nodes with an attribute value of one
            for i, nodes in enumerate(C):
            #for i, nodes in C:
                for node in nodes:

                    # Does this node have a value of one in layer A, B?
                    a = (layers[layerA].has_key(node) and layers[layerA][node] == 1)
                    b = (layers[layerB].has_key(node) and layers[layerB][node] == 1)

                    # Only increment the count if both a and b are not one
                    if not (a and b):
                        if a:
                            A[i] += 1
                        if b:
                            B[i] += 1

            layerPairs.append([layerA, layerB, A, B])

    return layerPairs

def correlatePairs(layerPairs, directory, layoutIndex, layerIndices, windowLength):

    # Run the Pearson correlation on each of the layer vector pairs
    # Write to files of the form, layer_8_9_rstats.tab where 9 is the layout
    # index.

    pairCount = len(layerPairs)
    print timestamp(), pairCount, 'pairs to run for', windowLength, 'windows'
    # pairs_to_run = len(layer_window_values) ** 2 - len(layer_window_values)  # without compare to self

    # What layer are we writing the file for?
    current_first_layer = None

    # Where are we writing it to?
    writer = None
    
    # How many pairs have we done?
    pair = 0

    message_count = 1

    # Loop through all the pairs, writing to the stats file
    for (layer_a, layer_b, stat) in pearson_all_pairs(layerPairs):

        # Go get the stats for each pair of layers, grouped by the
        # first layer.
        
        if layer_a != current_first_layer:
            # We're changing first layers.
            
            if writer is not None:
                # Close the previous file.
                writer.close()
                
            # Open a tsv writer for the new first layer's correlations with
            # everyone else.
            file = os.path.join(directory, 'layer_' +
                str(layerIndices[layer_a]) + '_' + str(layoutIndex) + '_rstats.tab')
            writer = tsv.TsvWriter(open(file, 'w'))
                
            # Record that we're on that layer as the first layer now.
            current_first_layer = layer_a
            
        # Make a line for the stat result with this other layer.
        writer.line(layer_b, str(stat))
        
        pair += 1

        # Log a progress message for every ~1/30th of pairs processed
        if pair > pairCount * message_count / 30:
            print timestamp(), str(message_count) + '/30 of', pairCount, 'pairs'
            sys.stdout.flush()
            message_count += 1

    if writer is not None:
        # Close the last file.
        writer.close()

    print timestamp(), "{} pairs processed".format(pair)

def normalized_pearson_statistics(layers, layerNames, nodes_multiple, ctx, options):

    # For every binary layer and for every layout, we need a file called
    # layer_<layer number>_<layout number>_region.tab with scores associating
    # that layer with other layers of its type. This uses a normalized pearson
    # correlation to produce a score between -1 and 1, where -1 is the most 
    # anticorrelated, 0 is no correlation and 1 is the most correlated.
    # 
    # For binary data we are using a normalized pearson correlation that
    # accounts for sample biases. We are using these logical steps to get there:
    #
    # 1. Use the extents of the node positions as the first window.
    #
    # 2. Divide the window into a 2 X 2 grid containing 4 new equal-sized windows.
    # 
    # 3. Scan across all nodes, placing them into the appropiate window. These
    #    are stored as a vector of windows, with a vector of node names in each
    #    window. For the toy example, we will show node counts rather than names.
    #             toy: C = [2, 1, 3, 5]
    # 
    # 4. Drop any windows from the vector whose node count is below the
    #    lower_threshold.
    #             toy: with a lower_threshold of 2:
    #             C1 = [2, 3, 5]
    #
    # 5. Repeat Steps 2 - 4 for each window containing more nodes than the upper
    #    threshold
    # 
    # 6. Normalize this vector of counts. For each element:
    #     a. divide by the sum of the elements.
    #             toy: C2 =  [1/5, 3/5, 1]
    #     b. multiply by the pseudocount of 5
    #             toy: C3 = [1, 3, 5]
    #
    # 7. Look at each attribute compared with each other attribute. For each
    #    pair of attributes:
    #     a. For attribute A, create a vector with counts of the number
    #        of nodes in which attribute A is 1. Create an element in A for each
    #        window in C1.
    #             toy: A = [1, 2, 2]
    # 
    #     b. Do the same for attribute B.
    #             toy: B = [0, 1, 1]
    # 
    #     c. Compare vectors A and B. For each node in a window that
    #        has a value of one for both A and B, decrement that window count
    #        in both vectors.
    #             toy: if the 2nd window has one node that is in A & B:
    #             A1 = [1, 1, 2],  B1 = [0, 0, 1]
    # 
    #     d. For each element of A1 & B2 add the corresponding element of C3.
    #             toy: A2 = [2, 4, 4],  B2 = [1, 3, 6]
    # 
    #     e. Correlate vectors A and B with the Pearson method which returns an
    #        R correlation and a P value.

    if ctx.binary_layers == 0:
        print('No binary layers for region-based stats to process')
        return True

    for layoutIndex in ctx.all_hexagons.iterkeys():
        # We look at all layouts for this.
        # We assume layout doesn't somehow change layer types.

        # We're going to need a mapping from layer name to layer index.
        layerIndices = {name: i for i, name in enumerate(layerNames)}

        # Create the windows containing lists of node names in each window.
        # Following our naming scheme above, assign C to the curated windows
        C = window_tool(
            ctx,
            options.directory,
            nodes_multiple[layoutIndex],
            options.mi_window_threshold,
            options.mi_window_threshold_upper,
            layoutIndex,
        )

        # Transform the nodes lists in C to a list of node counts
        C1 = map(lambda x: len(x), C)

        # Normalize the node counts: divide by the sum of the counts and
        # multiply by the pseudocount.
        Sum = sum(C1)
        C2 = map(lambda x: float(x) * PSEUDOCOUNT / Sum, C1)

        layerPairs = buildLayerPairs(ctx.binary_layers, layers, C, C2)

        # for layoutIndex in ctx.all_hexagons.iterkeys():

        correlatePairs(layerPairs, options.directory, layoutIndex, layerIndices, len(C))

def region_based_statistics(layers, layerNames, nodes_multiple, ctx, options):
    normalized_pearson_statistics(layers, layerNames, nodes_multiple, ctx, options)
