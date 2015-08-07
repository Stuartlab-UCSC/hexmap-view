"""
assoc_stats.py: Run the association statistics.
"""
import argparse, sys, os, itertools, math, numpy, subprocess, shutil, tempfile
import collections, multiprocessing, traceback, time, pprint
import scipy.stats, scipy.linalg, scipy.misc
import time 
import os.path
import tsv, csv
# TODO remove unused libraries above

def find_means (layers, hex_names):
    """
    Find the mean of each attribute's value in each hexagram
    @param layers: attributes/layers to include
    @param hex_names: hexagram names to include
    @returns means in the form:
        [[attr, layer-index, mean], [attr, layer-index, mean], ...]
        where layer-index is the index of the given layers
        TODO why is the index not that of the global layers?
    Note that we throw out NaN values
    """
    #import pdb; pdb.set_trace()

    # Create the list that will contain the attribute/layer lists
    num_layers = len(layers)
    layer_means = [ [] for i in range(num_layers) ]

    # The data structure for accessing tissue scores/layer values is:
    # layers dict: layer name, sample-id, score/value
    for index, layer_name in enumerate(layers):
        layer_means[index].append(layer_name)
        layer_mean_index = layers.index(layer_name)
        layer_means[index].append(layer_mean_index)

        # Holds the sum of continuous values for each attribute
        values = 0

        # Keep track of the number of samples that have a value
        num_val = 0
        for sample in hex_names:
            try:
                score = layers[layer_name][sample]
            except KeyError:
                continue
            values += score
            num_val += 1

        if (num_val > 0):
            mean_v = values/(num_val)
        else:
            mean_v = 0
        layer_means[index].append(mean_v)

    return layer_means 

def pearson (subprocess_string, optionsDirectory, total_processes, ac):
    """
    The subprocess call to pearson.py takes the following arguments
    args[] = 'python'
    args[0] = 'pearson.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four values.
               The four value are "layer1 index, layer 2 index, cont layer 1
               index, cont layer 2 index;..."
    args[3] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file
    """ 
    return subprocess.Popen(['python', 'pearson.py', ac['tmp_dir'], subprocess_string, str(total_processes)])

def chi2 (subprocess_string, optionsDirectory, total_processes, ac):
    """
    The subprocess call to chi.py takes the following arguments
    args[] = 'python'
    args[0] = 'chi.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four indices:
               layer1, layer 2, chi layer 1 chi layer 2
    args[3] = 'working_directory' - directory to which main process writes files
    args[4] = 'total_processes' - index for names of the output file n
    """
    return subprocess.Popen(['python', 'chi.py', ac['tmp_dir'], subprocess_string, optionsDirectory, total_processes])

def stats_looper (
    layer_names, # args RO
    num_processes, # args max_processes RO
    num_pairs, # args max_tables  RO
    ac, # association stats context
    ctx, # hexagram context
    options): # statistical function  RO

    # Counter to chain together a variable number of layer combinations
    # for subprocesses
    current_pairs = 0

    return_status = []

    # List of pids
    pids = []

    # Counter for active subprocesses
    current_processes = 0

    # Counter for total processes. This will index the output files
    # from the stats function.
    total_processes = 0

    # Loop through the layers for the data types of interest, creating strings
    # that will be passed to the stats subprocess. First group layer indices of
    # attributes to be compared, separated by commas. Then append additional
    # index groups, separated by semi-colons.
    for index1, a1_name in enumerate (ac['stats_layers']):
        index2 = index1

        # Loop through the remainder of the layers to form pairs to compare
        for a2_name in ac['stats_layers'][index1:]:
            if ac['type'] == 'chi2':
                # Index according to layer_names (all layers). This is needed
                # to look up the appropriate raw data file.
                l1_index = str(layer_names.index(a1_name))
                l2_index = str(layer_names.index(a2_name))

                # Join layer indices & binary layer indices (used to place the p-values
                # returned by the subprocess into the numpy matrix) by commas.
                current_string = ",".join([l1_index, l2_index, str(index1), str(index2)])
            elif ac['type'] == 'pear':
                current_string = ",".join([str(index1), str(index2)])

            # Initialize new subprocess string or add to the existing one
            # chaining current strings with semi-colons.
            if (current_pairs == 0):
                subprocess_string = current_string
            else:
                subprocess_string = ";".join([subprocess_string, current_string])

            if (current_pairs == num_pairs) or (a2_name == ac['stats_layers'][-1]):

                # Loop while the number of current processes is below the allowed
                # number. Poll each process until one has successfully completed.
                # Delete this pid, lower the counter by one and open a pid with
                # the created string.
                while current_processes >= num_processes:
                    for pid_index, x in enumerate (pids):
                         value = x.poll()
                         if value == 0:
                             current_processes -= 1
                             del pids[pid_index]
                             del return_status[pid_index]
                             break
                #print 'subprocess_string', subprocess_string
                x = ac['stats_fx'](subprocess_string, options.directory,
                    str(total_processes), ac)

                pids.append (x)
                return_status.append(None)
                current_processes += 1
                total_processes += 1
                current_pairs = 0

            # Increase the counter for current tables. When this counter is
            # equal to the variable-defined number of tables per subprocess
            # reset the counter to 0.
            # Increase index2 by 1
            index2 += 1
            current_pairs += 1

    return {'return_status': return_status, 'pids': pids}

def per_stats_type (layers, layer_names, num_processes, num_pairs, ac, ctx, options):
    """
    This tool will launch a variable number of independent threads, each of which
    will calculate a variable number of correlations for pairs of attributes.

    Each subprocess will write its correlation values to a file along with each
    correlation's layer indices. These indices will map the correlation value
    to a numpy matrix. After all computations are complete, we will open all 
    these temporary files and place them in the matrix in two locations:
    (index 1, index 2) & (index 2, index 1). Then we shall print out the layer
    association stats file for the client to access.
    """
    # Mechanism for code execution after all pids have completed
    all_complete = False

    returned = stats_looper (
        layer_names,
        num_processes,
        num_pairs,
        ac,
        ctx,
        options)
    return_status = returned['return_status']
    pids = returned['pids']

    while all_complete == False:
        for index, pid in enumerate(pids):
            return_status[index] = pid.poll()
            if return_status[index] == None or return_status[index] == 0:
                continue
            elif return_status[index] > 0 or return_status[index] < 0:
                sys.exit(return_status[index])
        all_complete = all(status == 0 for status in return_status)

    num_layers = len(ac['stats_layers'])
    corr_vals = numpy.zeros(shape=(num_layers, num_layers))

    tmp_dir_elements = os.listdir(ac['tmp_dir'])
    for file_name in tmp_dir_elements:
        if file_name != ac['ref_file']:
            reader = tsv.TsvReader(open(os.path.join(ac['tmp_dir'], file_name), "r"))
            iterator = reader.__iter__()
            for line in iterator:
                if ac['type'] == 'chi2':
                    index1 = int(line[0])
                    index2 = int(line[1])
                    val = float(line[2])
                elif ac['type'] == 'pear':
                   index1 = int(line[2])
                   index2 = int(line[3])
                   val = float(line[4])

                corr_vals[index1, index2] = val
                corr_vals[index2, index1] = val

    # Delete our temporary directory.
    shutil.rmtree(ac['tmp_dir'])

    #print 'corr_vals'
    #pprint.pprint(corr_vals)
    for index, row in enumerate(corr_vals):
        name = ac['stats_layers'][index]
        #if ac['type'] == 'pear':
        #    name = name[0]
        layer_index = str(layer_names.index(name))
        writer = tsv.TsvWriter(open(os.path.join(options.directory,
            'layer_' + layer_index + '_' + ac['type'] + '.tab'), 'w'))
        writer.line(*ac['stats_layers'])
        writer.line(*row)
        writer.close()

    return True

def association_statistics(layers, layer_names, ctx, options):
    """
    The tool will deploy the appropriate association stat test on each
    array of layers. These tools will compute the correlation values between pairs
    of attributes.

    The values generated from each individual stats test will be printed to
    seperate files. On the clientside the user will be asked to select what type
    of value they want to correlate their selected attribute against.
    """
    """
    # Run Stats on Continuous Layers.
    # Create the association statistics context.
    ac = {
        'type': 'pear',
        'stats_fx': pearson, # the stats to be run on this data
        'stats_layers': ctx.continuous_layers, # data types for these stats
        'tmp_dir': tempfile.mkdtemp(), # the dir to store temporary working files
        'ref_file': 'cont_values.tab', # a temporary reference file of continuous values for these stats
    }

    # Find the mean of each continuous attribute
    # At the moment we will be hardcoding the map layout on which
    # association statistics will be run.
    layout_idx = 0
    cont_values = find_means(ctx.continuous_layers, ctx.all_hexagons[layout_idx].values())
    print 'cont_values'
    pprint.pprint(cont_values)

    # save the continuous values file
    writer = tsv.TsvWriter(open(os.path.join(ac['tmp_dir'], ac['ref_file']), "w"))
    for layer in cont_values:
        writer.line(*layer)
    writer.close()

    per_stats_type(cont_values, layer_names, 10, 100, ac, ctx, options)
    """

    # Run Stats on binary & categorical Layers.
    # Create the association statistics context.
    ac = {
        'type': 'chi2',
        'stats_fx': chi2, # the stats to be run on this data
        'stats_layers': ctx.binary_layers + ctx.categorical_layers, # data types for these stats
        'tmp_dir': tempfile.mkdtemp(), # the dir to store temporary working files
        'ref_file': 'hex_names.tab', # a temporary reference file of hexagon names for these stats
    }

    # Create the temporary hex names file
    hex_values = ctx.all_hexagons[0].values()
    writer = tsv.TsvWriter(open(os.path.join(ac['tmp_dir'], ac['ref_file']), "w"))
    writer.line(*hex_values)
    writer.close()

    per_stats_type(layers, layer_names, 10, 3600, ac, ctx, options)
    return True    
