#!/usr/bin/env python2.7
"""
statsLayout.py: Calculate the region-based-stats

"""
import sys, os,traceback, time, datetime, pprint, csv, pool
import numpy as np
from statsLayer import ForEachLayer

PSEUDOCOUNT = 5

# Extra to capture nodes on the far sides of the grid extents
TINY_BIT = 0.00000000001

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def window_tool(directory, nodes_raw, lowerT, upperT, layout):
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

    # Define the iterative function for drawing the adaptive grid
    def window_level(minX, minY, windowWidth, gridId):
        """
        This collects node names belonging to a 2 x 2 grid of 4 windows, with
        window lengths of W. minX and minY are the minimum coordinates of the 
        grid.
        """
        W = windowWidth

        # Write the grid for this level to a file
        midX = minX + W
        midY = minY + W
        row = [minX, midY, minX + W * 2, midY]
        f.writerow(row)
        row = [midX, minY, midX, minY + W * 2]
        f.writerow(row)

        # Initialize windows as a grid that will contain up to 4 windows,
        # each containing nodes whose coordinates are within that window. These
        # windows will be indexed by (window_row, window_col) resulting in up to
        # 4 windows with indices of:  (0,0), (1,0) (1,1), (0,1).

        windows = dict([
            ((0, 0), []),
            ((1, 0), []),
            ((1, 1), []),
            ((0, 1), []),
        ])

        # For each node within the boundaries of the grid, add it to the
        # window whose boundaries contain the node
        for name, coord in nodes.iteritems():

            # Try to find the window for this node and save if it is found
            col = int((coord[0] - minX) // W)
            row = int((coord[1] - minY) // W)
            if col > -1 and col < 2 and row > -1 and row < 2:
                windows[(col, row)].append(name)

        # Windows with no nodes will not be in the list of window counts. Using
        # the thresholds, determine which windows to toss, which to keep, and
        # which to divide further.
        divide = []
        for widx, names in windows.iteritems():
            len_names = len(names)

            # For window node counts above the upper threshold, divide further.
            if len_names > upperT:
                divide.append(widx)
            else:
                # Remove the nodes for consideration in further divisions
                for name in names:
                    try:
                        del nodes[name]
                    except:
                        print 'ERROR: node was already removed:', name

                # Window counts above the lower threshold get saved to the
                # curated list
                if len_names >= lowerT:
                    curated.append(names)

        # For each window with too many nodes, divide it into 4 new windows
        midX = minX + W
        midY = minY + W
        W /= 2
        for widx in divide:

            # Determine the new minimums and recurse. Window indices start at
            # the origin in the upper left window and go clockwise.
            if widx == (0, 0):
                window_level(minX, minY, W, gridId + '.1')
            elif widx == (1, 0):
                window_level(midX, minY, W, gridId + '.2')
            elif widx == (1, 1):
                window_level(midX, midY, W, gridId + '.3')
            elif widx ==(0, 1):
                window_level(minX, midY, W, gridId + '.4')
            else:
                print 'ERROR: bad window index in grid:', widx

        # End of window_level()

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

    # Find the maximum extents, and normalize each node by shifting it to the
    # origin (0, 0).
    nodes = {}
    for name, coord in nodes_raw.iteritems():
        nodes[name] = (coord[0] - minX, coord[1] - minY)

    hex_count = len(nodes.keys())

    # Write the grid to a file for display in the visualizer
    filename = os.path.join(directory, 'grid_' + str(layout) + '.tab')
    with open(filename, 'w') as f:
        f = csv.writer(f, delimiter='\t')

        # Write the bounds of the outer-most grid, adding a bit to the window
        # width so no node will be exactly on the South or West borders
        G = max((maxX - minX), (maxY - minY))
        W = G / 2 + TINY_BIT
        f.writerow([0, 0, G, 0])
        f.writerow([0, 0, 0, G])
        f.writerow([G, G, G, 0])
        f.writerow([G, G, 0, G])

        # Initialize the array where we store windows with node counts
        # between the lower and upper thresholds
        curated = []

        # Start up the adaptive windowing by passing the origin and window width to
        # the recursive routine
        window_level(0, 0, W, '1')

    if len(nodes.keys()) > 0:
        print 'ERROR: nodes that were not assigned to a window:', nodes

        # Write these orphans to a file for debugging
        filename = os.path.join(directory, 'gridOrphans_' + str(layout) + '.tab')
        with open(filename, 'w') as f:
            f = csv.writer(f, delimiter='\t')
            for name, coord in nodes.iteritems():
                f.writerow([name])

    print timestamp(), 'Windowing complete'
    sys.stdout.flush()

    return curated
    
    # Convert the python array to a numpy array for future calculations
    # TODO should this be a numpy array from the beginning?
    #np_curated = np.array(curated)
    #return np_curated

def find_single_attr_counts (C, data):

    # Find the counts for a single attribute in each window
    # data is in the form: {s0: 1, s1: 1 ...}
    # C is in the form: [ ['s0', 's1', 's10'],
    #                     ['s2', 's3', 's4'],
    #                     ['s5', 's6', 's7', 's8', 's9'] ]

    # Define an array to contain bin counts.
    A = [0, 0, 0, 0]

    # Count the nodes that have values for this attribute
    for window in C:
        ones = 0
        max = 0
        for node in window:
            if node in data:
                max += 1
                if data[node] == 1:
                    ones += 1

        # Find the bin boundaries
        lower = [0, 1, float(max)/3, float(max)*2/3]
        
        # Increment the appropriate bin count
        for i in [3, 2, 1, 0]:
            if ones >= lower[i]:
                A[i] += 1
                break
            
    return A

def find_attrs_counts (C, layers, ctx):

    # Find the counts for each attribute in each window
        
    # Create a simple array to contain the counts for each attribute.
    attr_counts = {}
    
    for attr in ctx['binary_layers']:
    
         # For each window, categorize the counts for this attribute.
         # TODO this function could be parallelized easily
        attr_counts[attr] = find_single_attr_counts(C, layers[attr]['data'])

    return attr_counts;

def weighted_chi2_statistics (
        layers, layerNames, nodes_multiple, ctx, options):

    # For every binary layer and for every layout, we need a file called
    # layer_<layer-number>_<layout-number>.tab with scores associating
    # that layer with other layers of its type.
    #
    # These steps use a toy model to describe the process. A graphic of the toy
    # model is at:
    # https://docs.google.com/presentation/d/1zHLy47E2koXN75AXnel9fmYVLqZQB8t7WpbMGDhfp1g/edit#slide=id.p
    #
    # 1. Build an adaptive grid resulting in a list with one element
    #    per window which contains a list of node names in that window. Let's
    #    say that results in three windows with an adaptive grid called C.
    #    lower_threshold = 2, upper threshold = 6
    #       toy: C =  [ ['s0', 's1', 's10'],
    #                   ['s2', 's3', 's4'],
    #                   ['s5', 's6', 's7', 's8', 's9'] ]
    #
    # 2. Transform the adaptive grid, C, from node names to node counts for each
    #    window and call this C1. (TODO we may not need this array.)
    #       toy: C1 =  [3, 3, 5]
    #
    # 3. For each attribute:
    #
    #    a. Define an array to contain bin counts of the nodes with values for
    #       the attribute. There will be 4 bins defined as zero, low, medium
    #       high counts. Initialize the counts to zero.
    #           toy: A = [0, 0, 0, 0]
    #
    #    b. For each window:
    #       - find max = the count of nodes with values of one or zero
    #       - find the bin boundaries using:
    #           index   range
    #           0       0
    #           1       low = 1 -> 1/3 of max
    #           2       med = 1/3 of max -> 2/3 of max
    #           3       hi  = greater than 2/3 of max
    #       - find ones = the count of nodes with a value of one
    #       - increment the appropriate bin for the count of ones
    #           toy: attribute A for window[2] has:
    #                   max = 4 nodes with a value of zero or one
    #                   ones = 4 nodes with with a value of one
    #                So the bin ranges for this window and this attribute are:
    #                   index   range
    #                   0       x = 0
    #                   1       1 >= x > 4/3
    #                   2       4/3 >= x > 8/3
    #                   3       x >= 8/3
    #                The ones count of 4 is greater than 8/3,
    #                so we increment the high bin:
    #                   A = [0, 0, 0, 1]
    #                After processing attributes A and B,
    #                we end up with these two arrays:
    #                   A = [1, 0, 0, 2]
    #                   B = [0, 0, 0, 3]
    #
    # 4. For each pair of attributes:
    #
    #    a. Create a contingency table, T, where the first cell at (0,0) would
    #       be the number of windows where there are no nodes for A and no nodes
    #       for B. The last cell at (3,3) would be the number of windows where A
    #       has node counts in the high bin and B has node counts in the high
    #       bin.
    #           toy: T =   A:   0    1    2    3
    #                 B:    0   0    0    0    0
    #                       1   0    0    1    0
    #                       2   1    0    1    0
    #                       3   0    0    0    0
    #
    #    b. Perform a chi-squared test using table T to get the p-value.
    #
    #    c. Apply weight factors to each cell of the table T according to this
    #       weight table:
    #           W = [ [ 7, -1, -2, -4],
    #                 [-1,  4  -1  -2],
    #                 [-2, -1,  4, -1],
    #                 [-4, -2, -1,  7] ]
    #
    #    d. Apply a function to determine the sign of the association, negative
    #       or positive.
    
    if ctx.binary_layers == 0:
        print 'No binary layers for layout-aware stats to process'
        return

    for layout in ctx.all_hexagons.iterkeys():

        # Create the windows containing lists of node names in each window.
        # Following our naming scheme above, assign C to the curated windows
        # Note we find the windows even if we are not computing layout-aware
        # stats so we can use the windowing later for dynamic stats.
        C = window_tool(
            options.directory,
            nodes_multiple[layout],
            options.mi_window_threshold,
            options.mi_window_threshold_upper,
            layout,
        )

        # Transform the nodes lists in C to a list of node counts
        C1 = map(lambda x: len(x), C)

        # Write the window node counts to a file for use in
        # dynamic stats initiated by the client
        # TODO see old code in normalized_pearson_statistics().

        # If layout-aware stats were not requested, we're done with this layout.
        if not options.mutualinfo:
            print 'Skipping sort stats for layout-aware'
            continue

        # Find the count of values of one for each attribute in each window.
        attr_counts = find_attr_counts (C, layers, ctx, options)


# Unused.
def normalized_pearson_statistics (
        layers, layerNames, nodes_multiple, ctx, options):
    # 
    # We are using these logical steps to get there:

    # For every binary layer and for every layout, we need a file called
    # layer_<layer-number>_<layout-number>.tab with scores associating
    # that layer with other layers of its type.
    #
    # This uses a normalized pearson correlation correlation that accounts for
    # sample biases to produce a score between -1 and 1, where -1 is the most
    # anticorrelated, 0 is no correlation and 1 is the most correlated.
    # 
    # We are using these logical steps to get there:
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
    #     d. For each element of A1 & B1 add the corresponding element of C3.
    #             toy: A2 = [2, 4, 4],  B2 = [1, 3, 6]
    # 
    #     e. Correlate vectors A and B with the Pearson method which returns an
    #        R correlation and a P value.

    for layout in ctx.all_hexagons.iterkeys():
        # We look at all layouts for this.

        # Create the windows containing lists of node names in each window.
        # Following our naming scheme above, assign C to the curated windows
        # Note we find the windows even if we are not computing layout-aware
        # stats so we can use the windowing later for dynamic stats.
        C = window_tool(
            options.directory,
            nodes_multiple[layout],
            options.mi_window_threshold,
            options.mi_window_threshold_upper,
            layout,
        )

        # Transform the nodes lists in C to a list of node counts
        C1 = map(lambda x: len(x), C)

        # Normalize the node counts to create the windows addtives:
        # divide by the sum of the counts and multiply by the pseudocount.
        Sum = sum(C1)
        C2 = map(lambda x: float(x) * PSEUDOCOUNT / Sum, C1)

        # Write the window node counts and additives to a file for use in
        # dynamic stats initiated by the client
        filename = os.path.join(options.directory,
            'windows_' + str(layout) + '.tab')
        with open(filename, 'w') as f:
            f = csv.writer(f, delimiter='\t')
            i = 0
            for nodes in C:
                line = [C2[i]]
                for node in nodes:
                    line.append(node)
                f.writerow(line)
                i += 1

        if not options.mutualinfo:
            print 'Skipping sort stats for layout-aware'
            continue

        if ctx.binary_layers == 0:
            print 'No binary layers for layout-aware stats to process'
            continue

        # The number of pairs to compare without compare to self
        pairCount = len(ctx.binary_layers) ** 2 - len(ctx.binary_layers)
        print 'Starting to build', pairCount, 'layer pairs...'

        # Create the stats parameters
        parm = {
            'directory': options.directory,
            'layers': layers,
            'layout': str(layout),
            'statsLayers': ctx.binary_layers,
            'windowAdditives': C2,
            'windowNodes': C,
        }

        # TODO easy testing without subprocesses
        # for layerA in parm['statsLayers']:
        #     parm['layerA'] = layerA
        #     parm['layerIndex'] = layerNames.index(layerA)
        #     oneLayer = ForEachLayer(parm)
        #     oneLayer()
        
        # Handle the stats for each layer, in parallel
        allLayers = []
        for layer in parm['statsLayers']:
            parm['layerA'] = layer
            parm['layerIndex'] = layerNames.index(layer)
            allLayers.append(ForEachLayer(parm))

        print pool.hostProcessorMsg()
        print len(ctx.binary_layers), 'subprocesses to run, one per layer.'

        pool.runSubProcesses(allLayers)

        print timestamp(), 'Stats complete for layout:', layout

def statsLayout(directory, layers, layerNames, nodes_multiple, ctx, options):
    print timestamp(), "Running region-based statistics..."
    normalized_pearson_statistics(layers, layerNames, nodes_multiple, ctx, options)
    print timestamp(), "Region-based statistics complete"

