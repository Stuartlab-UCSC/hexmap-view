#!/usr/bin/env python2.7
"""
regionBasedStats.py: Calculate the region-based-stats

"""
import sys, os,traceback, time, datetime, pprint, csv, pool
from statsSortLayer import ForEachLayer

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
        Note that gridId is just for debugging.
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
        # width so no node will be on the South or West borders
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
        print 'No binary layers for region-based stats to process'
        return True

    for layout in ctx.all_hexagons.iterkeys():
        # We look at all layouts for this.

        # Create the windows containing lists of node names in each window.
        # Following our naming scheme above, assign C to the curated windows
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
            'writeFile': True,
        }

        """
        # TODO easy testing without subprocesses
        for layerA in parm['statsLayers']:
            parm['layerA'] = layerA
            parm['layerIndex'] = layerNames.index(layerA)
            oneLayer = ForEachLayer(parm)
            oneLayer()
        """
        
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
        

def statsSortLayout(directory, layers, layerNames, nodes_multiple, ctx, options):
    print timestamp(), "Running region-based statistics..."
    normalized_pearson_statistics(layers, layerNames, nodes_multiple, ctx, options)
    print timestamp(), "Region-based statistics complete"

