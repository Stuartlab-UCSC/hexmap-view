#!/usr/bin/env python2.7
"""
mutualinformation.py: library for mutual information statistics for the tumor
map visualization.
"""

import collections, math

def compute_empirical_distribution(values):
    """
    Given a list of (hashable) values, return a dict from each value to its
    observed probability. The probability of unobserved things is 0.
    
    See <https://gist.github.com/elsonidoq/4230222>.
    
    """
    
    # Count all the values
    counts = collections.Counter(values)
    
    # Divide all the counts by the total number of things, yielding the
    # probability. Put these probabilities in a defaultdict with a default
    # probability of 0.
    return collections.defaultdict(float, {value: float(count) / len(values) 
        for value, count in counts.iteritems()})

def mutual_information(x_distribution, y_distribution, xy_distribution):
    """
    Given two distributions of things, and the joint distribution of tuples,
    calculate the mutual information between the two distributions, in bits.
    
    Draws on <https://gist.github.com/elsonidoq/4230222>.
    
    """
    
    # Sum up the mutual information, measured in bits (so we use log base 2
    # below)
    information = 0
    
    for x in x_distribution.iterkeys():
        for y in y_distribution.iterkeys():
            # For each possible X and Y value pair
            if xy_distribution[(x, y)] == 0:
                # Python will break when we try and take a log of 0 below, so
                # just know that the contribution from this pair is 0 and we
                # don't have to add it to the sum.
                continue
            
            # Add in the contribution to mutual information (as specified on
            # Wikipedia: <http://en.wikipedia.org/wiki/Mutual_information>)
            information += (xy_distribution[(x, y)] * 
                math.log(xy_distribution[(x, y)] / (x_distribution[x] * 
                y_distribution[y]), 2))
                
    # Return the total mutual information
    return information
    
def entropy(distribution):
    """
    Given a distribution, compute the entropy of it in bits.
    
    """
    
    # Find the entropy as in
    # <http://en.wikipedia.org/wiki/Uncertainty_coefficient>. Comes out in bits
    # due to the use of log base 2.
    total = 0
    
    for value, probability in distribution.iteritems():
        # Sum the probability of each thing times the negative log of that.
        total -= probability * math.log(probability, 2)
        
    # Return the entropy of the distribution.
    return total
    
def all_pairs(value_dict):
    """
    Given a dict of lists (or "layers") by name, all the same length, calculates
    mutual information (in the form of a normalized redundancy float, from 0 to
    1), between each pair of lists (except pairs of the same lists).
    
    Yields tuples of the form (layer name, other layer name, normalized
    redundancy). All the tuples with the same first layer name are yielded in a
    contiguous group.
    
    """
    
    # Compute the individual distributions, and store them by layer name.
    distributions = {layer_name: compute_empirical_distribution(values) 
        for layer_name, values in value_dict.iteritems()}
        
    # Pre-compute the individual entropies in bits
    entropies = {layer_name: entropy(distribution) 
        for layer_name, distribution in distributions.iteritems()}
        
    for layer_a in value_dict.iterkeys():
        # For each layer
        
        if entropies[layer_a] == 0:
            # We can't find normalized mutual information since one
            # layer always has the same value for every window. Skip
            # this pair.
            print("Layer {} has 0 entropy; skipping.".format(layer_a))
            continue
            
        for layer_b in value_dict.iterkeys():
            # Compute the mutual information with each other layer. This gets
            # done each way, since order matters here.
            
            if entropies[layer_b] == 0:
                # We can't find normalized mutual information since one
                # layer always has the same value for every window. Skip
                # this pair.
                continue
            
            if layer_a == layer_b:
                # Don't do layers against themselves. That would be silly.
                continue
            
            # First compute the joint distribution on-demand. We only ever
            # use it this once.
            joint_distribution = compute_empirical_distribution(
                zip(value_dict[layer_a], value_dict[layer_b]))
            
            # Work out the mutual information between this pair of layers,
            # using the precomputed distributions. TODO: this isn't going to
            # work well at all if we don't have enough windows that we can
            # eliably estimate the distribution of (discrete) sum integers
            # for a given layer from the observed sum values for that layer.
            
            # Calculate the mutual information in bits
            information = mutual_information(distributions[layer_a], 
                distributions[layer_b], joint_distribution)
                
            # Calculate the redundancy
            redundancy = information / (entropies[layer_a] + 
                entropies[layer_b])
            
            # Calculate the maximum possible redundancy
            max_redundancy = (min(entropies[layer_a], entropies[layer_b]) / 
                (entropies[layer_a] + entropies[layer_b]))
                
            # Store the normalized redundancy: portion of max, scaled 0 to
            # 1. Redundancy is defined as in
            # <http://en.wikipedia.org/wiki/Mutual_information> TODO: factor
            # out the identical denominators.
            redundancy /= max_redundancy
            
            # Yield the redundancy value
            yield (layer_a, layer_b, redundancy)
