#!/usr/bin/env python2.7
"""
hexagram.py: Given a matrix of similarities, produce a hexagram visualization.

This script takes in the filename of a tab-separated value file containing a
sparse similarity matrix (with string labels) and several matrices of
layer/score data. It produces an HTML file (and several support files) that
provide an interactive visualization of the items clustered on a hexagonal grid.

This script depends on the DrL graph layout package, binaries for which must be
present in your PATH.

Re-uses sample code and documentation from 
<http://users.soe.ucsc.edu/~karplus/bme205/f12/Scaffold.html>
"""

import argparse, sys, os, itertools, math, numpy, subprocess, shutil, tempfile
import collections, multiprocessing, traceback, numpy, time, pprint
import scipy.stats, scipy.linalg, scipy.misc
import time 
import os.path
import tsv, csv
from assocStats import association_statistics

# We have a mutualinformation module to do the MI calculations.
import mutualinformation

# Global variable to hold opened matrices files
#matrices = []

# Store global variables in one global context
class Context:
    def __init__(s):
        s.matrices = [] # Opened matrices files
        s.all_hexagons = {} # Hexagon dicts {layout0: {(x, y): hex_name, ...}, layout1: {(x, y): hex_name, ...}}
        s.binary_layers = [] # Binary layer_names in the first layout
        s.continuous_layers = [] # Continous layer_names in the first layout
        s.categorical_layers = [] # categorical layer_names in the first layout
        s.beta_computation_data = {} # data formatted to compute beta values

    def printIt(s):
        print json.dumps(s, indent=4, sort_keys=True)
ctx = Context();

def parse_args(args):
    """
    Takes in the command-line arguments list (args), and returns a nice argparse
    result with fields for all the options.
    Borrows heavily from the argparse documentation examples:
    <http://docs.python.org/library/argparse.html>
    """
    
    # The command line arguments start with the program name, which we don't
    # want to treat as an argument for argparse. So we remove it.
    args = args[1:]
    
    # Construct the parser (which is stored in parser)
    # Module docstring lives in __doc__
    # See http://python-forum.com/pythonforum/viewtopic.php?f=3&t=36847
    # And a formatter class so our examples in the docstring look good. Isn't it
    # convenient how we already wrapped it to 80 characters?
    # See http://docs.python.org/library/argparse.html#formatter-class
    parser = argparse.ArgumentParser(description=__doc__, 
        formatter_class=argparse.RawDescriptionHelpFormatter)
    
    # Now add all the options to it
    # Options match the ctdHeatmap tool options as much as possible.
    parser.add_argument("similarity", type=str, nargs='+',
        help="the unopened files of similarity matrices")
    parser.add_argument("--names", type=str, action="append", default=[],
        help="human-readable unique names for all the similarity matrices")
    parser.add_argument("--scores", type=str,
        action="append", default=[],
        help="a TSV to read scores for each signature from")
    parser.add_argument("--raw", type=str, nargs='+',
        help="the unopened files of raw data matrices")
    parser.add_argument("--type", type=str, nargs='+',
        help="the data types of the raw data matrices")
    parser.add_argument("--rawsim", type=str, nargs='+',
        help="correlates the raw data file to its similarity matrix")
    parser.add_argument("--colormaps", type=str,
        default=None,
        help="a TSV defining coloring and value names for discrete scores")
    parser.add_argument("--html", "-H", type=str, 
        default="index.html",
        help="where to write HTML report")
    parser.add_argument("--directory", "-d", type=str, default=".",
        help="directory in which to create other output files")
    parser.add_argument("--drlpath", "-r", type=str, 
        help="directory in which contain drl binaries")
    parser.add_argument("--query", type=str, default=None,
        help="Galaxy-escaped name of the query signature")
    parser.add_argument("--window_size", type=int, default=20,
        help="size of the window to use when looking for clusters")
    parser.add_argument("--mi_window_size", type=int, default=25,
        help="size of the window to use when running mutual information stats")
    parser.add_argument("--mi_window_threshold", type=int, default=30,
        help="min number of hexes in a mutual information window to count it")
    parser.add_argument("--mi_binary_no_binning", action="store_false", 
        dest="mi_binary_binning",
        help="whether to bin counts from binary layers for mutual information")
    parser.add_argument("--truncation_edges", type=int, default=10,
        help="number of edges for DrL truncate to pass per node")
    parser.add_argument("--no-stats", dest="stats", action="store_false", 
        default=True,
        help="disable cluster-finding statistics")
    parser.add_argument("--no-associations", dest="associations", action="store_false", 
        default=True,
        help="disable computation of attribute association statistics")
    parser.add_argument("--no-mutualinfo", dest="mutualinfo", action="store_false", 
        default=True,
        help="disable computation of mutual infomration statistics")
    parser.add_argument("--include-singletons", dest="singletons", 
        action="store_true", default=False,
        help="add self-edges to retain unconnected points")
        
   
    a = parser.parse_args(args)
    print "#ARGS",args, a, "raw",a.raw
    return a

def hexagon_center(x, y, scale=1.0):
    """
    Given a coordinate on a grid of hexagons (using wiggly rows in x), what is 
    the 2d Euclidian coordinate of its center?
    
    x and y are integer column and row coordinates of the hexagon in the grid.
    
    scale is a float specifying hexagon side length.
    
    The origin in coordinate space is defined as the upper left corner of the 
    bounding box of the hexagon with indices x=0 and y=0.
    
    Returns a tuple of floats.
    """
    # The grid looks like this:
    #
    #   /-\ /-\ /-\ /-\ 
    # /-\-/-\-/-\-/-\-/-\
    # \-/-\-/-\-/-\-/-\-/
    # /-\-/-\-/-\-/-\-/-\
    # \-/-\-/-\-/-\-/-\-/
    # /-\-/-\-/-\-/-\-/-\
    # \-/ \-/ \-/ \-/ \-/
    #   
    # Say a hexagon side has length 1
    # It's 2 across corner to corner (x), and sqrt(3) across side to side (y)
    # X coordinates are 1.5 per column
    # Y coordinates (down from top) are sqrt(3) per row, -1/2 sqrt(3) if you're 
    # in an odd column.
    
    center_y = math.sqrt(3) * y
    if x % 2 == 1:
        # Odd column: shift up
        center_y -= 0.5 * math.sqrt(3)
        
    return (1.5 * x * scale + scale, center_y * scale + math.sqrt(3.0) / 2.0 * 
        scale)

def hexagon_pick(x, y, scale=1.0):
    """
    Given floats x and y specifying coordinates in the plane, determine which 
    hexagon grid cell that point is in.
    
    scale is a float specifying hexagon side length.
    
    See http://blog.ruslans.com/2011/02/hexagonal-grid-math.html
    But we flip the direction of the wiggle. Odd rows are up (-y)
    """
    
    # How high is a hex?
    hex_height = math.sqrt(3) * scale
    
    # First we pick a rectangular tile, from the point of one side-traingle to 
    # the base of the other in width, and the whole hexagon height in height.
    
    # How wide are these tiles? Corner to line-between-far-corners distance
    tile_width = (3.0 / 2.0 * scale)
    
    # Tile X index is floor(x / )
    tile_x = int(math.floor(x / tile_width))
    
    # We need this intermediate value for the Y index and for tile-internal
    # picking
    corrected_y = y + (tile_x % 2) * hex_height / 2.0
    
    # Tile Y index is floor((y + (x index mod 2) * hex height/2) / hex height)
    tile_y = int(math.floor(corrected_y / hex_height))
    
    # Find coordinates within the tile
    internal_x = x - tile_x * tile_width
    internal_y = corrected_y - tile_y * hex_height
    
    # Do tile-scale picking
    # Are we in the one corner, the other corner, or the bulk of the tile?
    if internal_x > scale * abs(0.5 - internal_y / hex_height):
        # We're in the bulk of the tile
        # This is the column (x) of the picked hexagon
        hexagon_x = tile_x
        
        # This is the row (y) of the picked hexagon
        hexagon_y = tile_y
    else:
        # We're in a corner.
        # In an even column, the lower left is part of the next row, and the 
        # upper left is part of the same row. In an odd column, the lower left 
        # is part of the same row, and the upper left is part of the previous 
        # row.
        if internal_y > hex_height / 2.0:
            # It's the lower left corner
            # This is the offset in row (y) that being in this corner gives us
            # The lower left corner is always 1 row below the upper left corner.
            corner_y_offset = 1
        else:
            corner_y_offset = 0
            
        # TODO: verify this for correctness. It seems to be right, but I want a
        # unit test to be sure.
        # This is the row (y) of the picked hexagon
        hexagon_y = tile_y - tile_x % 2 + corner_y_offset
        
        # This is the column (x) of the picked hexagon
        hexagon_x = tile_x - 1
    
    # Now we've picked the hexagon
    return (hexagon_x, hexagon_y)    

def radial_search(center_x, center_y):
    """
    An iterator that yields coordinate tuples (x, y) in order of increasing 
    hex-grid distance from the specified center position.
    """
    
    # A hexagon has neighbors at the following relative coordinates:
    # (-1, 0), (1, 0), (0, -1), (0, 1)
    # and ((-1, 1) and (1, 1) if in an even column)
    # or ((-1, -1) and (1, -1) if in an odd column)
    
    # We're going to go outwards using breadth-first search, so we need a queue 
    # of hexes to visit and a set of already visited hexes.
    
    # This holds a queue (really a deque) of hexes waiting to be visited.
    # A list has O(n) pop/insert at left.
    queue = collections.deque()
    # This holds a set of the (x, y) coordinate tuples of already-seen hexes,
    # so we don't enqueue them again.
    seen = set()
    
    # First place to visit is the center.
    queue.append((center_x, center_y))
    
    while len(queue) > 0:
        # We should in theory never run out of items in the queue.
        # Get the current x and y to visit.
        x, y = queue.popleft()
        
        # Yield the location we're visiting
        yield (x, y)
        
        # This holds a list of all relative neighbor positions as (x, y) tuples.
        neighbor_offsets = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        if y % 2 == 0:
            # An even-column hex also has these neighbors
            neighbor_offsets += [(-1, 1), (1, 1)]
        else:
            # An odd-column hex also has these neighbors
            neighbor_offsets += [(-1, -1), (1, -1)]
    
        for x_offset, y_offset in neighbor_offsets:
            # First calculate the absolute position of the neighbor in x
            neighbor_x = x + x_offset
            # And in y
            neighbor_y = y + y_offset
            
            if (neighbor_x, neighbor_y) not in seen:
                # This is a hex that has never been in the queue. Add it.
                queue.append((neighbor_x, neighbor_y))
                
                # Record that it has ever been enqueued
                seen.add((neighbor_x, neighbor_y))
    
    
    

def assign_hexagon(hexagons, node_x, node_y, node, scale=1.0):
    """
    This function assigns the given node to a hexagon in hexagons. hexagons is a
    defaultdict from tuples of hexagon (x, y) integer indices to assigned nodes,
    or None if a hexagon is free. node_x and node_y are the x and y coordinates 
    of the node, adapted so that the seed node lands in the 0, 0 hexagon, and 
    re-scaled to reduce hexagon conflicts. node is the node to be assigned. 
    scale, if specified, is the hexagon side length in node space units.
    
    This function assigns nodes to their closest hexagon, reprobing outwards if 
    already occupied.
    
    When the function completes, node is stored in hexagons under some (x, y) 
    tuple.
    
    Returns the distance this hexagon is from its ideal location.
    """
    
    # These hold the hexagon that the point falls in, which may be taken.
    best_x, best_y = hexagon_pick(node_x, node_y, scale=scale)
    
    for x, y in radial_search(best_x, best_y):
        # These hexes are enumerated in order of increasign distance from the 
        # best one, starting with the best hex itself.
        
        if hexagons[(x, y)] is None:
            # This is the closest free hex. Break out of the loop, leaving x and
            # y pointing here.
            break
    
    # Assign the node to the hexagon
    hexagons[(x, y)] = node
    
    return math.sqrt((x - best_x) ** 2 + (y - best_y) ** 2)

def hexagons_in_window(hexagons, x, y, width, height):
    """
    Given a dict from (x, y) position to signature names, return the list of all
    signatures in the window starting at hexagon x, y and extending width in the
    x direction and height in the y direction on the hexagon grid.
    """        
    
    # This holds the list of hexagons we've found
    found = []
    
    for i in xrange(x, x + width):
        for j in xrange(y, y + height):
            if hexagons.has_key((i, j)):
                # This position in the window has a hex.
                found.append(hexagons[(i, j)])
                
    return found

class ClusterFinder(object):
    """
    A class that can be invoked to find the p value of the best cluster in its 
    layer. Instances are pickleable.
    """
    
    def __init__(self, hexagons, layer, window_size=5):
        """
        Keep the given hexagons dict (from (x, y) to signature name) and the 
        given layer (a dict from signature name to a value), and the given 
        window size, in a ClusterFinder object.
        """
        
        # TODO: This should probably all operate on numpy arrays that we can 
        # slice efficiently.
        
        # Store the layer
        self.hexagons = hexagons
        # Store the hexagon assignments
        self.layer = layer
        
        # Store the window size
        self.window_size = window_size
    
    @staticmethod
    def continuous_p(in_values, out_values):
        """
        Get the p value for in_values and out_values being distinct continuous 
        distributions.
        
        in_values and out_values are both Numpy arrays. Returns the p value, or 
        raises a ValueError if the statistical test cannot be run for some
        reason.
        
        Uses the Mann-Whitney U test.
        """
    
        # Do a Mann-Whitney U test to see how different the data  
        # sets are.
        u_statistic, p_value = scipy.stats.mannwhitneyu(in_values, 
            out_values)
            
        return p_value
    
    @staticmethod    
    def dichotomous_p(in_values, out_values):
        """
        Given two one-dimensional Numpy arrays of 0s and 1s, compute a p value 
        for the in_values having a different probability of being 1 than the 
        frequency of 1s in the out_values.
        
        This test uses the scipy.stats.binom_test function, which does not claim
        to use the normal approximation. Therefore, this test should be valid
        for arbitrarily small frequencies of either 0s or 1s in in_values.
        
        TODO: What if out_values is shorter than in_values?
        """
        
        if len(out_values) == 0:
            raise ValueError("Background group is empty!")
        
        # This holds the observed frequency of 1s in out_values
        frequency = numpy.sum(out_values) / len(out_values)
        
        # This holds the number of 1s in in_values
        successes = numpy.sum(in_values)
        
        # This holds the number of "trials" we got that many successes in
        trials = len(in_values)
        
        # Return how significantly the frequency inside differs from that 
        # outside.
        return scipy.stats.binom_test(successes, trials, frequency)
    
    @staticmethod    
    def categorical_p(in_values, out_values):
        """
        Given two one-dimensional Numpy arrays of integers (which may be stored
        as floats), which represent items being assigned to different 
        categories, return a p value for the distribution of categories observed
        in in_values differing from that observed in out_values.
        
        The normal way to do this is with a chi-squared goodness of fit test. 
        However, that test has invalid assumptions when there are fewer than 5 
        expected and 5 observed observations in every category. 
        See http://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chis
        quare.html
        
        However, we will use it anyway, because the tests that don't break down
        are prohibitively slow.
        """
        
        # Convert our inputs to integer arrays
        in_values = in_values.astype(int)
        out_values = out_values.astype(int)
        
        # How many categories are there (count 0 to the maximum value)
        num_categories = max(numpy.max(in_values), numpy.max(out_values)) + 1
        
        # Count the number of in_values and out_values in each category
        in_counts = numpy.array([len(in_values[in_values == i]) for i in 
            xrange(num_categories)])
        out_counts = numpy.array([len(out_values[out_values == i]) for i in 
            xrange(num_categories)])
        
        # Get the p value for the window being from the estimated distribution
        # None of the distribution parameters count as "estimated from data" 
        # because they aren't estimated from the data under test.
        _, p_value = scipy.stats.chisquare(in_counts, out_counts)
        
        return p_value
        
    def __call__(self):
        """
        Find the best p value for any window of size window_size. Return it.
        """

        # Calculate the bounding box where we want to look for windows.
        # TODO: This would just be all of a numpy array
        min_x = min(coords[0] for coords in self.hexagons.iterkeys())
        min_y = min(coords[1] for coords in self.hexagons.iterkeys()) 
        max_x = max(coords[0] for coords in self.hexagons.iterkeys())
        max_y = max(coords[1] for coords in self.hexagons.iterkeys()) 
        
        # This holds a Numpy array of all the data by x, y
        layer_data = numpy.empty((max_x - min_x + 1, max_y - min_y + 1))
        
        # Fill it with NaN so we can mask those out later
        layer_data[:] = numpy.NAN
        
        for (hex_x, hex_y), name in self.hexagons.iteritems():
            # Copy the layer values into the Numpy array
            if self.layer.has_key(name):
                layer_data[hex_x - min_x, hex_y - min_y] = self.layer[name]
        
        # This holds a masked version of the layer data
        layer_data_masked = numpy.ma.masked_invalid(layer_data, copy=False) 
        
        # This holds the smallest p value we have found for this layer
        best_p = float("+inf")
        
        # This holds the statistical test to use (a function from two Numpy 
        # arrays to a p value)
        # The most specific test is the dichotomous test (0 or 1)
        statistical_test = self.dichotomous_p
        
        if numpy.sum(~layer_data_masked.mask) == 0: 
            # There is actually no data in this layer at all.
            # nditer complains if we try to iterate over an empty thing.
            # So quit early and say we couldn't find anything.
            return best_p
 
        for value in numpy.nditer(layer_data_masked[~layer_data_masked.mask]):
            # Check all the values in the layer.
            # If this value is out of the domain of the current statistical 
            # test, upgrade to a more general test.
            
            if statistical_test == self.dichotomous_p and (value > 1 or 
                value < 0):
                
                # We can't use a dichotomous test on things outside 0 to 1
                # But we haven't yet detected any non-integers
                # Use categorical
                statistical_test = self.categorical_p
            
            if value % 1 != 0:
                # This is not an integer value
                # So, we must use a continuous statistical test
                statistical_test = self.continuous_p
                
                # This is the least specific test, so we can stop now
                break
        
                
        for i in xrange(min_x, max_x, self.window_size):
            for j in xrange(min_y, max_y, self.window_size):            
                # Look at tiling windows. We're allowed to go a bit beyond the
                # edge of the space on the high edges; it will be fine.


                # Get the layer values for hexes in the window, as a Numpy
                # masked array.
                in_region = layer_data_masked[i:i + self.window_size, 
                    j:j + self.window_size]
                    
                # And as a 1d Numpy array
                in_values = numpy.reshape(in_region[~in_region.mask], -1).data
                
                # And out of the window (all the other hexes) as a masked array
                out_region = numpy.ma.copy(layer_data_masked)
                # We get this by masking out everything in the region
                out_region.mask[i:i + self.window_size, 
                    j:j + self.window_size] = True
                
                # And as a 1d Numpy array
                out_values = numpy.reshape(out_region[~out_region.mask], 
                    -1).data
                 
                    
                if len(in_values) == 0 or len(out_values) == 0:
                    # Can't do any stats on this window
                    continue
                    
                if len(in_values) < 0.5 * self.window_size ** 2:
                    # The window is less than half full. Skip it.
                    # TODO: Make this threshold configurable.
                    continue
                
                try:    
                    
                    # Get the p value for this window under the selected 
                    # statistical test
                    p_value = statistical_test(in_values, out_values)
                        
                    # If this is the best p value so far, record it
                    best_p = min(best_p, p_value)
                except ValueError:
                    # Probably an all-zero layer, or something else the test 
                    # can't handle.
                    # But let's try all the other windows to be safe. 
                    # Maybe one will work.
                    pass
                    
                
                
        # We have now found the best p for any window for this layer.
        print "Best p found: {}".format(best_p)
        sys.stdout.flush()
        
        return best_p                

def run_functor(functor):
    """
    Given a no-argument functor (like a ClusterFinder), run it and return its 
    result. We can use this with multiprocessing.map and map it over a list of 
    job functors to do them.
    
    Handles getting more than multiprocessing's pitiful exception output
    """
    
    try:
        return functor()
    except:
        # Put all exception text into an exception and raise that
        raise Exception(traceback.format_exc())

def determine_layer_data_types (layers, layer_names, options):
    """
    This tool will act as the organizational control for all association 
    stats tools. It will break up the layers into arrays based upon their
    data type. For the moment, there will only be arrays for binary,
    continuous, and categorical variables. 
    """
    # For the moment, we are only going to worry about single layouts. 
    hex_dict_num = 0

    # Retrieve the hexagon names from the appropriate hexagon dictionary
    hex_values = ctx.all_hexagons[hex_dict_num].values()

    # For each layer name, scan through all its values. If you find a non-integral
    # value, it's continuous. Otherwise, if you find a value greater than 1 or
    # less than 0, it's categorical (which we don't care about at the moment).
    # Otherwise, it's binary.
    for index, layer_name in enumerate (layer_names):
        # Does this layer meet the requirements of a binary layer?
        can_be_binary = True
    
        # Does this layer meet the requirements of a categorical (not
        # continuous) layer?
        can_be_categorical = True
    
        for value in layers[layer_name].itervalues():
            # Not accounting for categorical layers at the moment
            
            if value % 1 != 0:
                # It's continuous (fractional)
                can_be_binary = False
                can_be_categorical = False
                break
            
            if value > 1 or value < 0:
                # It's not binary, but it could still be either continuous
                # or categorical.
                can_be_binary = False
            
                  
        if can_be_binary:
            # We're done, and nothing rules out it being binary
            ctx.binary_layers.append(layer_name)
        elif can_be_categorical:
            # It's not binary and we didn't hit a continuous value
            ctx.categorical_layers.append(layer_name)
        else:
            # It is not binary or categorical, so it is continuous
            ctx.continuous_layers.append(layer_name)

    # Write the lists of continuous, binary, and categorical layers to files
    # The Clientside will use these to determine what values to diplay
    # (what file to open).
    type_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
    "Layer_Data_Types.tab"), "w"))

    type_writer.line("Continuous", *ctx.continuous_layers)
    type_writer.line("Binary", *ctx.binary_layers)
    type_writer.line("Categorical", *ctx.categorical_layers)
 
    type_writer.close()


def run_mutual_information_statistics(layers, layer_names, options):
    """    
    For every binary or continuous layer and for every layout, we need a
    mi_<layer number>_<layout number>.tab file, with scores asociating that
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
            options.mi_window_size, threshold=options.mi_window_threshold,
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
            window_sums = [sum((layers[layer_name][hexagon] 
                if layers[layer_name].has_key(hexagon) else 0)
                for hexagon in window)
                for window in curated_windows]
           
            if options.mi_binary_binning:
                # We want to bin counts
                
                # Now we have our list of the sums values for each window.
                # Histogram bin the non-NaN values. See
                # <https://gist.github.com/elsonidoq/4230222>
                _, bins = numpy.histogram([total for total in window_sums 
                    if not math.isnan(total)])
                    
                # Work out the bin numbers for all the totals (NaN windows get the
                # past-the-end bin)
                layer_window_values[layer_name] = numpy.digitize(window_sums,
                    bins)
            else:
                # Don't bin counts.
                layer_window_values[layer_name] = window_sums
                
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
                
        
        print "{} pairs to run".format(len(layer_window_values) ** 2 -
            len(layer_window_values))
            
        # What layer are we writing the file for?
        current_first_layer = None
        # Where are we writing it to?
        information_writer = None
        
        # How many pairs have we done?
        pair = 0
        
        for (layer_a, layer_b, redundancy) in mutualinformation.all_pairs(
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
            
        print("{} pairs processed".format(pair))
            
        if information_writer is not None:
                    # Close the last file.
                    information_writer.close()

def window_tool(width, height, threshold=0, layout_index=0):
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
    x_values = extract_coords (0, hex_values_length, ctx.all_hexagons[layout_index])
    y_values = extract_coords (1, hex_values_length, ctx.all_hexagons[layout_index])
    
    
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

def continuous_window_values(layers, layer_names, curated_windows):
    """
    This tool will generate a list of attributes (layers). Each element
    in this list will contain a list, containing 3 types of values. The first 
    type of value will be a string containing the layer/attribute name.
    The second type of value will be the index of the layer within continuous_layers.
    The third type of value will be the mean value of the continuous values
    for the samples in that window.
    """
    # NOTE: TODO: This routine is not currently being used and may have only
    # been intended for association stats, but those are layout-independent,
    # so should not be windowed.
    # At the moment we will be harcoding the map for which windowing and other
    # association statistics will be run upon. 
    hex_dict_num = 0

    # Retrieve the hexagon names from the appropriate hexagon dictionary
    hex_values = ctx.all_hexagons[hex_dict_num].values()

    # Create the list that will contain the attribute/layer lists
    num_layers = len(layer_names)
    cont_layers = [ [] for i in range(num_layers) ]

    # The data structure for accessing tissue scores/layer values is:
    # layers dict: layer name, sample-id, score/value
    for index, layer_name in enumerate(layer_names):
        cont_layers[index].append(layer_name)
        cont_layer_index = ctx.continuous_layers.index(layer_name)
        cont_layers[index].append(cont_layer_index)
        for window in curated_windows:
            # Holds the continuous values for each window
            values = 0
            # Keep track of the number of samples that have value
            num_val = 0
            for sample in window:
                try:
                    score = layers[layer_name][sample]
                    values = values + score
                    num_val += 1
                except KeyError:
                   values += 0
            # 0 Will Signify No Val
            # When we run a Pearson Correlation, we will splice out
            # this indices
            if (num_val > 0):
                mean_v = values/(num_val)
            else:
                mean_v = 0
            cont_layers[index].append(mean_v)
                
    return cont_layers 



def pearson_corr_2 (cont_values, layer_names, options, num_processes, num_pairs):
    """    
    This tool will compute pearson correlation coefficients and p-values
    using two attributes from cont_layers. This tool will run the scipy 
    stats calculation utilizing a series of subprocesses initiated via
    the popen module and the pearson.py code. 
    
    The pearson.py will take several arguments (popen only takes strings): 

    args[] = 'python'
    args[0] = 'pearson.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four values.
               The four value are "layer1 index, layer 2 index, cont layer 1
               index, cont layer 2 index;..."
    args[3] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file
    """ 
    # Where pearson.py is sitting. It should be right next to this file.
    file_loc = os.path.dirname(os.path.realpath(__file__))

    # Make a temporary directory to hold the output files of the pearson.py script
    pearson_dir = tempfile.mkdtemp()

    # Print a file containing all the values of cont_layers so that the
    # pearson.py subprocesses can independently access these values
    # Note that cont_layers has the following structure:
    # cont_values [0] = [Layer 1 Name, Index in continuous_layers, v1, v2, v3, v4...]
    cont_values_writer = tsv.TsvWriter(open(os.path.join(pearson_dir, "cont_values.tab"), "w"))
    for layer in cont_values:
        cont_values_writer.line(*layer)
    cont_values_writer.close()

    # Counter to chain together a variable number of layer combinations
    # for pearson.py subprocess
    current_pairs = 0
    # Counter for number of active subprocesses
    current_processes = 0
    # Counter for number of total processes. This will index the output files
    # from pearson.py.
    total_processes = 0
    # List of pids
    pids = []
    # Mechanism for code execution after all pids have completed
    all_complete = False
    return_status = []

    # index2 must not be reset to 0 every time

    # Loop through the layers, creating strings that will be passed to the 
    # the pearson.py subprocess. First group layer indices and binary layer indices
    # with commas. The former will allow the subprocess to access the raw
    # layer data files, and the latter will be printed along with the correlation 
    # coefficient values, indicating placement of the r-coefficient 
    # within the numpy matrix.   

    for index1, layer1 in enumerate(cont_values):
        index2 = index1
        for layer2 in cont_values[index1:]:
            # Combine two index integers by comma
            # Seperate each pair of integers by semi-colon
            # These pairs indicate which two layers to use in the pearson
            # correlation coefficient computation
            current_string = ",".join([str(index1), str(index2)])

            # Initialize a new subprocess string or add the existing one
            # chaining current strings together with semi colons
            if current_pairs == 0:
                subprocess_string = current_string
            else:
                subprocess_string = ";".join([subprocess_string, current_string])

            # If the number of current subprocesses is below the total
            # number of simultaneous processes allowed, open a new process
            # for the constructed string. If the number of current 
            # subprocesses is equal to the number of allowed processes
            # poll the pids until you find one that has completed 
            # successfully. Delete this pid, lower the counter by one
            # and open a pid with the created string.

            if current_processes < num_processes and current_pairs == num_pairs - 1:
                x = subprocess.Popen(['python', 'pearson.py', pearson_dir, subprocess_string, str(total_processes)], cwd = file_loc)

                pids.append (x)
                return_status.append(None)
                current_processes += 1
                total_processes += 1

            elif current_processes >= num_processes and current_pairs == num_pairs - 1:
                while current_processes >= num_processes:
                    for pid_index, x in enumerate (pids):
                         value = x.poll()
                         if value == 0:
                             current_processes += -1
                             del pids[pid_index]
                             del return_status[pid_index]
                             break

                x = subprocess.Popen(['python', 'pearson.py', pearson_dir, subprocess_string, str(total_processes)], cwd = file_loc)

                pids.append (x)
                return_status.append(None)
                current_processes += 1
                total_processes += 1

            # Increase the index2 counter.          
            # Also, Increase the counter for current pairs. When this counter is 
            # equal to the variable-defined number of pairs per subprocess
            # set the counter equal to 0.
            # Increase index2 by 1
            index2 += 1
            current_pairs += 1
            if current_pairs == num_pairs:
                current_pairs = 0

    print ("All processes complete: ", all_complete)
    while all_complete == False:
        for index, pid in enumerate(pids):
            return_status[index] = pid.poll()
            if return_status[index] == None or return_status[index] == 0:
                continue
            elif return_status[index] > 0 or return_status[index] < 0:
                print (pid, return_status[index], index)
                sys.exit(return_status[index])
        all_complete = all(status == 0 for status in return_status)
    print ("All processes complete: ", all_complete)

    num_layers = len(ctx.continuous_layers)
    r_coefficients = numpy.zeros(shape=(num_layers, num_layers))

    if all_complete == True:
       pearson_dir_elements = os.listdir(pearson_dir)
       print ("Directory Elements:", pearson_dir_elements)
       for file_name in pearson_dir_elements:
           if file_name != "cont_values.tab":
               r_reader = tsv.TsvReader(open(os.path.join(pearson_dir, file_name), "r"))
               r_iterator = r_reader.__iter__()
               for values in r_iterator:
                   index1 = int(values[2])
                   index2 = int(values[3])
                   r_val = float(values[4])
                   r_coefficients[index1, index2] = r_val 
                   r_coefficients[index2, index1] = r_val

    # Delete our temporary directory.
    shutil.rmtree(pearson_dir)

    for index, row in enumerate(r_coefficients):
        name = ctx.continuous_layers[index]
        layer_list_index = str(layer_names.index(name))

        r_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "layer_" + layer_list_index +"_r_r.tab"), "w")) 

        r_writer.line(*ctx.continuous_layers)
        r_writer.line(*row)
        r_writer.close() 

    return True

def open_matrices(names):
	"""
	The argument parser now take multiple similarity matrices as input and 
	saves their file name as strings. We want to store the names of these
	strings for display later in hexagram.js in order to allow the user to 
	navigate and know what type of visualization map they are looking at -
	gene expression, copy number, etc. 

	Since, the parser no longer opens the files automatically we must, do it
	in this function.
	"""

	# For each file name, open the file and add it to the matrices list
	# 'r' is the argument stating that the file will be read-only
	for i, similarity_filename in enumerate(names):
		print "Opening Matrix {}...".format(i)
		matrix_file = tsv.TsvReader(open(similarity_filename, "r")) 
		ctx.matrices.append(matrix_file)


def compute_beta (coords, PCA, index, options):
    """ 
    Compute and return a beta matrix from coords * matrix.
    Then print the matrix to a file to be read on clientside.
    """
    print ("PCA Shape", PCA.shape)
    print ("Coords Shape", coords.shape)

    # Calculate Betas
    beta = coords * PCA

    # Write Beta to a File
    beta_t = numpy.transpose(numpy.asmatrix(beta))
    beta_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "beta.tab"), "w"))

    for index, row in enumerate (beta_t):
        b1 = beta_t[index, 0]
        b2 = beta_t[index, 1]
        beta_writer.line(b1, b2)
    
    beta_writer.close()
   
    return beta

def return_beta(options):
    """ 
	Returns a boolean that determines whether betas can/should
	be computed.
	"""
    beta_boolean = True
    if options.raw is None:
        beta_boolean = False

    return beta_boolean

def raw_data_to_matrix(raw_data, hexagons_dict, data_type, options, index):
    """
	Converts raw data file into an m * n matrix, where m = samples
	and n = genes
	"""
    # First open the raw data file.
    raw = tsv.TsvReader(open(raw_data, 'r')) 

    # This holds an iterator over lines in that file
    data_iterator = raw.__iter__()
       
    # This holds the number of rows and columns to determine the dimensions
    # of our data matrix.
    numRows = 0
    numColumns = 0 

    # These lists hold the sample and gene names.
    sample_ids = []
    genes = []

    # Iterate over the raw data file to determine the number of rows
    # and the number of columns present so that we can create an appropriately
    # sized data matrix.
    # Also extract all the sample names
    for index, row in enumerate(data_iterator):
        numRows += 1
        numColumns = len(row)
        if index == 0:
            # Exclude the first element because it is simply the word "gene"
            sample_ids = row[1:] 

    # numRows and numColumns must be decreased by 1 to account for the headers
    numRows = numRows - 1
    numColumns = numColumns - 1 

    # Create the data matrix.
    data_matrix = numpy.zeros(shape=(numRows,numColumns))
    
    # Close the data file as we have alreaedy exhausted the iterator
    raw.close()
    
    # Re-open the file so that we can iterate over it and extract data values.
    raw = tsv.TsvReader(open(raw_data, 'r')) 
    data_iterator = raw.__iter__()

    # Skip the first line, which is simple the sample names. We already have 
    # these.
    data_iterator.next()

    # We must have two variables for the column index. One that signifies the
    # location in the raw data file and one that signifies the location in the
    # newly created data matrix. We are skipping the first column of the
    # raw data file, which is the gene names. If we only used cindex, which
    # tells us the column index of the file, we would leave the first column
    # of the data matrix blank. In order to avoid this, we introduce
    # data_cindex.

    data_cindex = 0
    for rindex, row in enumerate (data_iterator):
        cindex = 0
        data_cindex = 0
        for data_val in row:
            if (cindex == 0):
                # Cut out any "|ajfsfsf" values
                gene = data_val
                try: 
                    cut_off = gene.index("|")
                    gene = gene[:cut_off]
                except ValueError:
                    gene = data_val
                genes.append(gene)
            else:
                try:
                    data_matrix[rindex,data_cindex] = data_val
                    data_cindex += 1
                except ValueError:
                    data_matrix[rindex,data_cindex] = 0
                    data_cindex += 1                   
            cindex += 1    
    
    # Clear buffers to make sure that the matrix has been fully created.  
    sys.stdout.flush()

    # Close the raw data file. We no longer need to read from it.
    raw.close()

    # No we are going to match the samples found in the raw data file
    # in the same order as those found in the provdied hexagon dict, argument.
    # This way x and y coordinates will line up correctly with these 
    # raw data values, later when we compute the betas for the linear regression.
  
    # This will hold the appropriately listed data.
    correct_matrix = numpy.zeros(shape=(numRows,len(hexagons_dict)))
    
    # Extract the values from the hexagon_dict
    hexagon_values = hexagons_dict.values()

    # Initialize the variable that will hold the index of the hex in the 
    # sample_ids list.
    hex_index = None

    # For every hexagon in the provided dict, we will find the corresponding
    # hexagon in the data_matrix and store the sample's column number.
    # Then we will iterate over each row of the data_matrix and extract the 
    # specfic sample's data values and add them to the "correct matrix".

    for cindex, sample in enumerate (hexagon_values):
        dat_col_index = 0
        for sample_index, name in enumerate (sample_ids):
              if sample in name:         
                  hex_index = sample_index
                  break         
        for rindex, row in enumerate (data_matrix):
            element = row[hex_index]
            correct_matrix [rindex, cindex] = element
    
    del data_matrix

    # Finally let's write the list of genes to a tsv file
    # so that the client side can access the list of genes in
    # the correct order.
    # File Structure: Data Type (First Row), Gene in every following row

    gene_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "genes.tab"), "w"))

    gene_writer.line(data_type)
    gene_writer.line(*genes)
    gene_writer.close()
 
    print ("Correct Matrix:")
    print (correct_matrix)

    n_matrix = normalize_raw_data_values(correct_matrix, numRows, len(hexagons_dict))

    del correct_matrix

    return n_matrix

def extract_coords (axis, size, hexagons):
    """
    Extract the coordinate values for a certain set of hexagons
    and multiply these values by 2. Then assign them to a numpy matrix,
    and return this matrix.
    """
    coords_matrix = numpy.zeros(shape=(size, 1))
    min_val = min(coords[axis] for coords in hexagons.iterkeys())

    index = 0
        
    for coords, name in hexagons.iteritems():
        val = coords[axis] - min_val  
        val = val * 1
        coords_matrix[index, 0] = val
        index += 1
   
    return coords_matrix

def normalize_raw_data_values (matrix, numRows, numColumns):
    """
    Normalizes data values of a raw data matrix.
    """
    # Create the empty normalized matrix.
    n_matrix = numpy.zeros(shape=(numRows, numColumns))

    # An array of mean values, one mean value per sample (column)
    m_val = []

    # An array of standard deviation values, on stdDev value per sample (column)
    std_Dev_Val = []

    # Compute mean and standard deviation for each column of the data matrix
    i = 0
    print ("Columns:", numColumns)
    while (i < numColumns):
        column = matrix[:, i]
        mean = numpy.mean(column)
        m_val.append(mean)
        std_Dev = numpy.std(column)
        std_Dev_Val.append(mean)
        i += 1

    # Normalize the Data Matrix by these Values
    for rindex, row in enumerate(matrix):
        for cindex, value in enumerate(row):
                 n_value = matrix[rindex, cindex] - m_val[cindex]
                 n_value = n_value/std_Dev_Val[cindex]
                 n_matrix[rindex, cindex] = n_value

    print ("Normalized")
    print (n_matrix)

    return n_matrix
    

def drl_similarity_functions(matrix, index, options):
	"""
	Performs all the functions needed to format a similarity matrix into a 
	tsv format whereby the DrL can take the values. Then all of the DrL
	functions are performed on the similarity matrix.

	Options is passed to access options.singletons and other required apsects
    of the parsed args.
	"""
	
	# Work in a temporary directory
	# If not available, create the directory.
	drl_directory = tempfile.mkdtemp()
    
    # This is the base name for all the files that DrL uses to do the layout
    # We're going to put it in a temporary directory.
	# index added to extension in order to keep track of
	# respective layouts
	drl_basename = os.path.join(drl_directory, "layout" + str(index))

	# We can just pass our similarity matrix to DrL's truncate
    # But we want to run it through our tsv parser to strip comments and ensure
    # it's valid
    
    # This holds a reader for the similarity matrix
	sim_reader = matrix
    
    # This holds a writer for the sim file
	sim_writer = tsv.TsvWriter(open(drl_basename + ".sim", "w"))
    
	print "Regularizing similarity matrix..."
	sys.stdout.flush()
    
    # This holds a list of all unique signature names in the similarity matrix.
    # We can use it to add edges to keep singletons.
	signatures = set()

	print "Reach for parts in sim_reader"
	for parts in sim_reader:
        # Keep the signature names used
		signatures.add(parts[0])
		signatures.add(parts[1])
        
        # Save the line to the regularized file
		sim_writer.list_line(parts)
    
	if options.singletons:    
        # Now add a self-edge on every node, so we don't drop nodes with no
        # other strictly positive edges
		for signature in signatures:
			sim_writer.line(signature, signature, 1)
        
	sim_reader.close()
	sim_writer.close()
    
    # Now our input for DrL is prepared!
    
    # Do DrL truncate.
    # TODO: pass a truncation level
	print "DrL: Truncating..."
	sys.stdout.flush()
        if options.drlpath:
            subprocess.check_call(["truncate", "-t", str(options.truncation_edges), 
            drl_basename], env={"PATH": options.drlpath}) 
        else:
            subprocess.check_call(["truncate", "-t", str(options.truncation_edges),
                drl_basename])

    # Run the DrL layout engine.
	print "DrL: Doing layout..."
	sys.stdout.flush()
        if options.drlpath:
            subprocess.check_call(["layout", drl_basename], env={"PATH": options.drlpath}) 
        else:
            subprocess.check_call(["layout", drl_basename]) 
    
    # Put the string names back
	print "DrL: Restoring names..."
	sys.stdout.flush()
        if options.drlpath:
            subprocess.check_call(["recoord", drl_basename], env={"PATH": options.drlpath}) 
        else:
            subprocess.check_call(["recoord", drl_basename]) 
        
    # Now DrL has saved its coordinates as <signature name>\t<x>\t<y> rows in 
    # <basename>.coord
    
    # We want to read that.
    # This holds a reader for the DrL output
	coord_reader = tsv.TsvReader(open(drl_basename + ".coord", "r"))
    
    # This holds a dict from signature name string to (x, y) float tuple. It is
    # also our official collection of node names that made it through DrL, and
    # therefore need their score data sent to the client.
	nodes = {}

	print "Reading DrL output..."
	sys.stdout.flush()
	for parts in coord_reader:
		nodes[parts[0]] = (float(parts[1]), float(parts[2])) 

	coord_reader.close()
    
    # Delete our temporary directory.
	shutil.rmtree(drl_directory)

	# Return nodes dict back to main method for further processes
	return nodes

def compute_hexagram_assignments(nodes, index, options):
    """
    Now that we are taking multiple similarity matrices as inputs, we must
    compute hexagram assignments for each similarity matrix. These assignments 
    are based up on the nodes output provided by the DrL function. 

    Index relates each matrix name with its drl output, nodes, assignments, etc.
    Options contains the parsed arguments that are present in the main method.
    
    Returns the placement badness for the layout with the given index, and saves
    the hexagon assignment dict in the global all_hexagons dict under the layer
    index.
    
    """
    # Do the hexagon layout
    # We do the squiggly rows setup, so express everything as integer x, y
    
    # This is a defaultdict from (x, y) integer tuple to id that goes there, or
    # None if it's free.
    hexagons = collections.defaultdict(lambda: None)
    
    # This holds the side length that we use
    side_length = 1.0
    
    # This holds what will be a layer of how badly placed each hexagon is
    # A dict from node name to layer value
    placement_badnesses = {}
    
    for node, (node_x, node_y) in nodes.iteritems():
        # Assign each node to a hexagon
        # This holds the resulting placement badness for that hexagon (i.e. 
        # distance from ideal location)
        badness = assign_hexagon(hexagons, node_x, node_y, node,
            scale=side_length)
            
        # Put the badness in the layer
        placement_badnesses[node] = float(badness)
   
    # Normalize the placement badness layer
    # This holds the max placement badness
    max_placement_badness = max(placement_badnesses.itervalues())
    print "Max placement badness: {}".format(max_placement_badness)

    if max_placement_badness != 0:
        # Normalize by the max if possible.
        placement_badnesses = {node: value / max_placement_badness for node, 
            value in placement_badnesses.iteritems()}
   
    # The hexagons have been assigned. Make hexagons be a dict instead of a 
    # defaultdict, so it pickles.
    # TODO: I should change it so I don't need to do this.
    hexagons = dict(hexagons) 

    # Add this dict of hexagons to all_hexagons dict, so it can be used later
    # for statistics.
    ctx.all_hexagons[index] = hexagons

    # Now dump the hexagon assignments as an id, x, y tsv. This will be read by
    # the JavaScript on the static page and be used to produce the 
    # visualization.        
    hexagon_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "assignments"+ str(index) + ".tab"), "w"))

    # First find the x and y offsets needed to make all hexagon positions 
    # positive
    min_x = min(coords[0] for coords in hexagons.iterkeys())
    min_y = min(coords[1] for coords in hexagons.iterkeys())  
        
    for coords, name in hexagons.iteritems():
        # Write this hexagon assignment, converted to all-positive coordinates.
        hexagon_writer.line(name, coords[0] - min_x, coords[1] - min_y)    
    hexagon_writer.close()

    # Hand placement_badness dict to main method so that it can be sent to the
    # client. The hexagon assignment dict has already been saved in
    # all_hexagons.
    return placement_badnesses
                
def write_matrix_names(options):
    """
    Write the names of the similarity matrices so that hexagram.js can
    process the names and create the toggle layout GUI.
    We pass options to access the parsed args and thus the matrix names.
    """
    name_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "matrixnames.tab"), "w"))
    for i in options.names:
        name_writer.line(i)

    #name_writer.line("Linear Regression")
    #name_writer.close()
    
def run_clumpiness_statistics(layers, layer_names, window_size, layout_index):
    """
    
    Takes in a dict of layers by name, a list of layer names, an integer tiling
    window size, and an integer layout index.
    
    Run the tiling-window clumpiness statistics for all layers for the given
    layout. Returns a dict from layer name to clumpiness score (negative log 10
    of a p-value, so greater is more clumpy).
    
    There must be at least one layer.
    
    """
    
    print("Running tiling clumpiness statistics for layout {} with window size "
        "{}...".format(layout_index, window_size))

    # Load the hexagons dict for this layout
    hexagons = ctx.all_hexagons[layout_index]
    
    # This holds an iterator that makes ClusterFinders for all out layers
    cluster_finders = [ClusterFinder(hexagons, layers[layer_name], 
        window_size=window_size) for layer_name in layer_names]
    
    print "{} jobs to do.".format(len(cluster_finders))
   
    # This holds a multiprocessing pool for parallelization
    pool = multiprocessing.Pool()
   
    # This holds all the best p values in the same order
    best_p_values = pool.map(run_functor, cluster_finders)
    
    # Close down the pool so multiprocessing won't die sillily at the end
    pool.close()
    pool.join()
    
    # Return a dict from layer name to clumpiness score (negative log 10 of best
    # p value). We hope the order of the dict items has not changed. We max the
    # actual p value together with the min float, in case the p value is too
    # good (i.e. 0).
    return {layer_name: -math.log10(max(best_p_value, sys.float_info.min)) 
        for layer_name, best_p_value in itertools.izip(layer_names, 
        best_p_values)}

def hexIt(options):

    # Test our picking
    x, y = hexagon_center(0, 0)
    if hexagon_pick(x, y) != (0, 0):
        raise Exception("Picking is broken!")
    
    # First bit of stdout becomes annotation in Galaxy 
    # Make sure our output directory exists.
    if not os.path.exists(options.directory):
        # makedirs is the right thing to use here: recursive
        os.makedirs(options.directory)
	
    print "Writing matrix names..."
    # We must write the file names for hexagram.js to access.
    write_matrix_names(options)

    print "About to open matrices..."

	# We have file names stored in options.similarity
	# We must open the files and store them in matrices list for access
    open_matrices(options.similarity)

    print "Opened matrices..."

	# The nodes list stores the list of nodes for each matrix
	# We must keep track of each set of nodes
    nodes_multiple = []

    print "Created nodes_multiple list..."

	# Index for drl.tab and drl.layout file naming. With indexes we can match
	# file names, to matrices, to drl output files.
    for index, i in enumerate (ctx.matrices):
        nodes_multiple.append (drl_similarity_functions(i, index, options))
    
    # Compute Hexagam Assignments for each similarity matrix's drl output,
    # which is found in nodes_multiple.

    # placement_badnesses_multiple list is required to store the placement
    # badness dicts that are returned by the compute_hexagram_assignments
    # function. compute_hexagram_assignments will also fill in the all_hexagons
    # dict for each layout it processes, so we can get hexagon assignments for
    # those layouts when we go to do statistics.
    placement_badnesses_multiple = []
    for index, i in enumerate (nodes_multiple):
        # Go get the placement badness
        placement_badness = compute_hexagram_assignments(i, index, options)
            
        # Record the placement badness under this layout.
        placement_badnesses_multiple.append(placement_badness)

    # Now that we have hex assignments, compute layers.
    
    # In addition to making per-layer files, we're going to copy all the score
    # matrices to our output directory. That way, the client can download layers
    # in big chunks when it wants all layer data for statistics. We need to
    # write a list of matrices that the client can read, which is written by
    # this TSV writer.
    matrix_index_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "matrices.tab"), "w"))
        
    # Read in all the layer data at once
    # TODO: Don't read in all the layer data at once
    
    # This holds a dict from layer name to a dict from signature name to 
    # score.
    layers = {}
    
    # This holds the names of all layers
    layer_names = []
    
    for matrix_number, score_filename in enumerate(options.scores):
        # First, copy the whole matrix into our output. This holds its filename.
        output_filename = "matrix_{}.tab".format(matrix_number)
        shutil.copy2(score_filename, os.path.join(options.directory, 
            output_filename))
            
        # Record were we put it
        matrix_index_writer.line(output_filename)
    
        # This holds a reader for the scores TSV
        scores_reader = tsv.TsvReader(open(score_filename, "r"))
        
        # This holds an iterator over lines in that file
        # TODO: Write a proper header/data API
        scores_iterator = scores_reader.__iter__()
        
        try:
            # This holds the names of the columns (except the first, which is 
            # labels). They also happen to be layer names
            file_layer_names = scores_iterator.next()[1:]
            
            # Add all the layers in this file to the complete list of layers.
            layer_names += file_layer_names
            
            # Ensure that we have a dict for every layer mentioned in the file
            # (even the ones that have no data below). Doing it this way means
            # all score matrices need disjoint columns, or the last one takes
            # precedence.
            for name in file_layer_names:
                layers[name] = {} 
            
            for parts in scores_iterator:
                # This is the signature that this line is about
                signature_name = parts[0]
                
                # Check all nodes for signature name. Not just the first node.
                missing_from_subset = 0
                for node_subset in nodes_multiple:
                    if signature_name not in node_subset:
                        missing_from_subset += 1
                
                if missing_from_subset == len (nodes_multiple):
                    # This signature wasn't in our DrL output. Don't bother
                    # putting its layer data in our visualization. This saves
                    # space and makes the client-side layer counts accurate for
                    # the data actually displayable.
                    continue
                
                # These are the scores for all the layers for this signature
                layer_scores = parts[1:]
                
                for (layer_name, score) in itertools.izip(file_layer_names, 
                    layer_scores):
                    
                    # Store all the layer scores in the appropriate
                    # dictionaries.
                    try:
                        layers[layer_name][signature_name] = float(score)
                    except ValueError:
                        # This is not a float.
                        # Don't set that entry for this layer.
                        # TODO: possibly ought to complain to the user? But then
                        # things like "N/A" won't be handled properly.
                        continue
                    
        except StopIteration:
            # We don't have any real data here. Couldn't read the header line.
            # Skip to the next file
            pass
            
        # We're done with this score file now
        scores_reader.close()

    # We're done with all the input score matrices, so our index is done too.
    matrix_index_writer.close()
    
    # We have now loaded all layer data into memory as Python objects. What
    # could possibly go wrong?
    
    # Stick our placement badness layer on the end
    layer_names.append("Placement Badness")
    layers["Placement Badness"] = placement_badnesses_multiple[0]
       
    # Now we need to write layer files.
        
    # Generate some filenames for layers that we can look up by layer name.
    # We do this because layer names may not be valid filenames.
    layer_files = {name: os.path.join(options.directory, 
        "layer_{}.tab".format(number)) for (name, number) in itertools.izip(
        layer_names, itertools.count())}

    for layer_name, layer in layers.iteritems():
        # Write out all the individual layer files
        # This holds the writer for this layer file
        scores_writer = tsv.TsvWriter(open(layer_files[layer_name], "w"))
        for signature_name, score in layer.iteritems():
            # Write the score for this signature in this layer
            scores_writer.line(signature_name, score)
        scores_writer.close()
    
    # We send "clumpiness scores" for each layer to the client (greater is
    # clumpier), if the user has elected to spend the long amount of time it
    # takes to calculate them.
    
    # This holds a list of dicts of clumpiness scores by layer, ordered by
    # layout.
    clumpiness_scores = []
    
    if len(layer_names) > 0 and options.stats:
        # We want to do clumpiness scores. We skip it when there are no layers,
        # so we don't try to join a never-used multiproicessing pool, which
        # seems to hang.
        
        print "We need to run density statistics for {} layouts".format(
            len(options.similarity))
        
        for layout_index in xrange(len(options.similarity)):
            # Do the clumpiness statistics for each layout.
            
            clumpiness_scores.append(run_clumpiness_statistics(layers, 
                layer_names, options.window_size, layout_index))
        
    else:
        # We aren't doing any stats.
        
        print "Skipping density statistics."
        
        # Set everything's clumpiness score to -inf.
        clumpiness_scores = [collections.defaultdict(lambda: float("-inf")) 
            for _ in options.similarity]
    
    # Count how many layer entries are greater than 0 for each binary layer, and
    # store that number in this dict by layer name. Things with the default
    # empty string instead of a number aren't binary layers, but they can use
    # the empty string as their TSV field value, so we can safely pull any layer
    # out of this by name.
    layer_positives = collections.defaultdict(str)
    
    for layer_name in layer_names:
        # Assume it's a binary layer until proven otherwise
        layer_positives[layer_name] = 0
        for value in layers[layer_name].itervalues():
            if value == 1:
                # Count up all the 1s in the layer
                layer_positives[layer_name] += 1
            elif value != 0:
                # It has something that isn't 1 or 0, so it can't be a binary
                # layer. Throw it out and try the next layer.
                layer_positives[layer_name] = ""
                break
    
    # Write an index of all the layers we have, in the form:
    # <layer>\t<file>\t<number of signatures with data>\t<number of signatures
    # that are 1 for binary layers, or NaN> and then columns with the clumpiness
    # score for each layout.
    
    # This is the writer to use.
    index_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "layers.tab"), "w"))
    
    print "Writing layer index..."
        
    for layer_name, layer_file in layer_files.iteritems():
        # Gather together the parts to write
        parts = [layer_name, os.path.basename(layer_file),
            len(layers[layer_name]), layer_positives[layer_name]]
            
        for clumpiness_dict in clumpiness_scores:
            # Go through each dict of clumpiness scores by layer, in layout
            # order, and put the score for this layer in this layout at the end
            # of the line.
            
            parts.append(clumpiness_dict[layer_name])
    
        # Write the index entry for this layer
        index_writer.list_line(parts)
        
    index_writer.close()

    # Sort Layers According to Data Type
    determine_layer_data_types (layers, layer_names, options)

    # Run Associated Statistics
    if options.associations == True:
        print "Running association statistics..."
        association_statistics(layers, layer_names, ctx, options)

    # Run Mutual Information Statistics:
    if options.mutualinfo == True:
        print "Running MI statistics..."
        run_mutual_information_statistics(layers, layer_names, options)

    #create_gmt(layers, layer_names, options)
    
    # Check Whether User Provided Raw Data for Dynamic Loading
    should_compute = return_beta(options)
    print (should_compute)

    if (should_compute == True):
        # Extract Files Related to Beta Computation
        raw_data_files = options.raw

        # Extract the Data Types Provided by the User
        raw_data_types = options.type

        # Extract the values that correlate similarity matrices with raw
        # data files.
        # We reduce sim_val by 1 to reflect zero order.
        sim_list = options.rawsim
        for index, sim_val in enumerate (sim_list):
            sim_list[index] = int(sim_val) - 1

        # Default variable that will hold matrices
        test_matrix = None

        # First we must extract the values from each of the files in
        # raw_data_files and place them in a matrix.
        # Then we must extract the x and y coordinates for that set of hexagons.
        # Finally we must add this to the global dict of beta computation values.
	print raw_data_files
        for sim, raw_data in enumerate (raw_data_files):
            values = {}
            hex_dict_num = sim_list[sim]
            data_type = raw_data_types[sim]
            test_matrix = raw_data_to_matrix(raw_data, ctx.all_hexagons[hex_dict_num],
                data_type, options, sim)
            values[0] = test_matrix
            hex_values = ctx.all_hexagons[hex_dict_num].values()
            hex_values_length = len(hex_values)
            coords = {}
            x_values = extract_coords (0, hex_values_length, ctx.all_hexagons[hex_dict_num])
            y_values = extract_coords (1, hex_values_length, ctx.all_hexagons[hex_dict_num])
            coords[0] = x_values
            coords[1] = y_values
            values[1] = coords
            ctx.beta_computation_data[sim] = values 
              
        for index, data_values in enumerate (ctx.beta_computation_data):

            data_val = ctx.beta_computation_data[index]  

            x_coords = data_val[1][0]
            y_coords = data_val[1][1]

            hex_values = ctx.all_hexagons[index].values()

            coords = numpy.zeros(shape=(len(hex_values), 2))

            for index, x in enumerate (x_coords):
                coords[index, 0] = x
                coords[index, 1] = y_coords[index]

            d_shape = data_val[0].shape
            
            """        
            # Samples to Train Algorithm
            t_matrix = numpy.zeros(shape=(d_shape[0], 1811))
            t_coords = numpy.zeros(shape=(2,1811))
            t_hex_values = []

            sample_index = 0
            cindex = 0
            while (cindex < 1811):
                gene_index = 0
                while (gene_index < d_shape[0]):
                    t_matrix [gene_index, cindex] = data_val[0][gene_index][sample_index] 
                    gene_index += 1
                t_coords[0, cindex] = coords[sample_index, 0]
                t_coords[1, cindex] = coords[sample_index, 1]
                t_hex_values.append(hex_values[sample_index])
                cindex += 1
                sample_index += 2

            # Samples to Test Algorithm
            s_matrix = numpy.zeros(shape=(d_shape[0], 1811))
            s_coords = numpy.zeros(shape=(2,1811))
            s_hex_values = []

            sample_index = 1
            cindex = 0
            while (cindex < 1811):
                gene_index = 0
                while (gene_index < d_shape[0]):
                    s_matrix [gene_index, cindex] = data_val[0][gene_index][sample_index] 
                    gene_index += 1
                s_coords[0, cindex] = coords[sample_index, 0]
                s_coords[1, cindex] = coords[sample_index, 1]
                s_hex_values.append(hex_values[sample_index])
                cindex += 1
                sample_index += 2

            # Let's write these s_coords to a file so that we can compare
            # them with the computed results
            sample_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
            "samples" + ".tab"), "w"))

            s_coords_t = numpy.transpose(numpy.asmatrix(s_coords))
          
            for index, row in enumerate (s_hex_values):
                x = str(s_coords_t[index, 0])
                y = str(s_coords_t[index, 1])
                sample_writer.line(s_hex_values[index], x, y)     
            
            sample_writer.close()  

            # Testing cache file printing with 10 samples
            # Hack 
            sample = numpy.transpose(numpy.asmatrix(data_val[0]))
            sample = sample[0:10]
            sample = numpy.transpose(sample)
            U, S, V = numpy.linalg.svd(sample, full_matrices=False)
            """
            # Take Single Value Decomposition of Matrix & Find PCA
            U, S, V = numpy.linalg.svd(data_val[0], full_matrices=False)
            print ("U", U.shape)
            print ("S", S.shape)
            print ("V", V.shape)

            # First Truncate and then transpose V
            PCA = V[0:25]

            #PCA = V[0:3585]
            PCA = numpy.transpose(PCA)

            #PCA = numpy.transpose(V)

            #beta = compute_beta (numpy.asmatrix(numpy.transpose(coords[0:10])), PCA, index, options)
            beta = compute_beta (numpy.asmatrix(numpy.transpose(coords)), PCA, index, options)
            #beta = compute_beta (numpy.asmatrix(t_coords), PCA, index, options)
            print ("Beta shape", beta.shape)
            
            # Let's create the 1/S diagonal matrix and the U^T Matrices so that
            # the user can complete a dynamic mapping with the add_to_hexagram
            # function.

            S = 1/S

            # Now we must print both the 1/S matrix to a file
            # This way the SVD can be accessed to load new patient data
            S_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
            "S.tab"), "w"))
            S_writer.line(*numpy.transpose(S))
            S_writer.close()

            #S = S[0:3585]
            S = S[0:25]
            S_diag = numpy.diag(numpy.transpose(S))

            # We also need a truncated version of U
            # New PCA Mapping: S_diag * U^T * new_sample_data
            # S_diag = 3585 * 3585, U^T = 3585 * 12724, new_sample_data = 12724 * n_samples

            U_t = numpy.transpose(U)
            #U_trunc_t = U_t[0:3585] 
            U_trunc_t = U_t[0:25]   
            #U_trunc_t = numpy.asmatrix(U_trunc_t)
            #U_trunc_t = U_t
            
            # Write the U^T matrix to cache file        
            U_T_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
            "U_T.tab"), "w"))      
            U_trunc_t_list = U_trunc_t.tolist()
            for row in U_trunc_t_list:
                U_T_writer.line(*row)              
            U_T_writer.close()
            
            # Demo Map Generation
            """       
            PCA_Test = numpy.asmatrix(S_diag) * numpy.asmatrix(U_trunc_t) * s_matrix 
            # Real Command for Mapping   
            PCA_Test = numpy.asmatrix(S_diag) * numpy.asmatrix(U_trunc_t) * data_val[0]
            print ("PCA_Test Shape", PCA_Test.shape)
            
print (PCA_Test)
              
            coords_2_swapped = beta * PCA_Test
            coords_2 = numpy.transpose(coords_2_swapped)

            hexagon_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
            "assignments"+ str(1) + ".tab"), "w"))

            for index, row in enumerate (hex_values):
                x = str(coords_2[index, 0])
                y = str(coords_2[index, 1])
                hexagon_writer.line(hex_values[index], x, y)    
            """              

    else:
        print ("No Data Provided...Skipping Beta Calculations")
	

    # Copy over the user-specified colormaps file, or make an empty TSV if it's
    # not specified.
    
    # This holds a writer for the sim file. Creating it creates the file.
    colormaps_writer = tsv.TsvWriter(open(os.path.join(options.directory, 
        "colormaps.tab"), "w"))
    
    if options.colormaps is not None:
        # The user specified colormap data, so copy it over
        # This holds a reader for the colormaps file
        colormaps_reader = tsv.TsvReader(open(options.colormaps, 'r'))

        print "Regularizing colormaps file..."
        sys.stdout.flush()
        
        for parts in colormaps_reader:
            colormaps_writer.list_line(parts)
        
        colormaps_reader.close()
    
    # Close the colormaps file we wrote. It may have gotten data, or it may 
    # still be empty.
    colormaps_writer.close()



    print "Visualization generation complete!"
       
    return 0
"""
    # Now copy any static files from where they live next to this Python file 
    # into the web page bundle.
    # This holds the directory where this script lives, which also contains 
    # static files.
    tool_root = os.path.dirname(os.path.realpath(__file__))
    
    # Copy over all the static files we need for the web page
    # This holds a list of them
    static_files = [
        # Static images
        "public/drag.svg",
        "public/filter.svg",
        "public/statistics.svg",
        "public/right.svg",
		"public/set.svg",
		"public/save.svg",
        "public/help.svg",
        "public/sort.svg",
        "public/mutual.svg",
        "public/throbber.svg",
		"public/sort_attributes.svg",
        
        # jQuery itself is pulled from a CDN.
        # We can't take everything offline since Google Maps needs to be sourced
        # from Google, so we might as well use CDN jQuery.
        
        # Select2 scripts and resources:
        "client/lib/select2.css",
        "client/lib/select2.js",
        "client/lib/select2.png",
        "client/lib/select2-spinner.gif",
        "client/lib/select2x2.png",
        
        # The jQuery-ui js & css
        "client/lib/jquery-ui.js",
        "client/lib/jquery-ui.theme.css",
        # The jQuery.tsv plugin
        "client/lib/jquery.tsv.js",
        # The color library
        "client/lib/color-0.4.1.js",
        # The jStat statistics library
        "client/lib/jstat.min.js",
        # The Google Maps MapLabel library
        "public/maplabel-compiled.js",
        # The main CSS file
        "client/hexagram.css",
        # The main JavaScript file that runs the page
        "client/hexagram.js",
        # Web Worker for statistics
        "public/statistics.js",
        # File with all the tool code
        "client/atools.js"
    ]
    
    # We'd just use a directory of static files, but Galaxy needs single-level
    # output.
    for filename in static_files:
        shutil.copy2(os.path.join(tool_root, filename), options.directory)
    
    # Copy the HTML file to our output file. It automatically knows to read
    # assignments.tab, and does its own TSV parsing
    shutil.copy2(os.path.join(tool_root, "hexagram.html"), options.html)

    print "Visualization generation complete!"
       
    return 0
"""

def main(args):
    """
    Parses command line arguments, and makes visualization.
    "args" specifies the program arguments, with args[0] being the executable
    name. The return value should be used as the program's exit code.
    """

    print "Starting command: {}".format(" ".join(args))
    return hexIt(parse_args(args)) # This holds the nicely-parsed options object

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = main(sys.argv)
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1
        
    sys.exit(return_code)
