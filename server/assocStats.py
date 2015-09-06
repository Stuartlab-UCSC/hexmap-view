"""
assocStats.py: Run the association statistics.
"""
import sys, os, numpy, subprocess, shutil, tempfile,pprint
import tsv, csv

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
    return subprocess.Popen(['python', 'pearson.py', ac['temp_dir'], subprocess_string, str(total_processes)])

def chi2 (subprocess_string, optionsDirectory, total_processes, ac):
    """
    The subprocess call to chi.py takes the following arguments
    args[] = 'python'
    args[0] = 'chi.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four indices:
               layer1, layer 2, chi layer 1 chi layer 2
    args[3] = 'working_directory' - directory to which main process writes files
    args[4] = 'total_processes' - index for names of the output file
    """
    return subprocess.Popen(['python', 'chi.py', ac['temp_dir'], subprocess_string, optionsDirectory, total_processes])

def stats_looper (
    layer_names, # args RO
    num_processes, # args max_processes RO
    num_pairs, # args max_pairs  RO
    ac, # association stats context
    ctx, # hexagram context
    options): # statistical function  RO

    # Counter to chain together a variable number of layer combinations
    # for subprocesses
    current_pairs = 0

    proc_status = []

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
    # slx = stats layer index, lx = global layer index
    for slx1, layer_name1 in enumerate (ac['stats_layers']):
        slx2 = slx1

        # Loop through the remainder of the layers to form pairs to compare
        for layer_name2 in ac['stats_layers'][slx1:]:
            # Index according to layer_names (all layers). This is needed
            # to look up the appropriate raw data file.
            lx1 = str(layer_names.index(layer_name1))
            lx2 = str(layer_names.index(layer_name2))

            # Join layer indices & stats layer indices (used to place the p-values
            # returned by the subprocess into the numpy matrix) by commas.
            current_string = ",".join([lx1, lx2, str(slx1), str(slx2)])

            # Initialize new subprocess string or add to the existing one
            # chaining current strings with semi-colons.
            if (current_pairs == 0):
               subprocess_string = current_string
            else:
                subprocess_string = ";".join([subprocess_string, current_string])

            if (current_pairs >= num_pairs) or (layer_name2 == ac['stats_layers'][-1]):

                # Loop while the number of current processes is below the allowed
                # number. Poll each process until one has successfully completed.
                # Delete this pid, lower the counter by one and open a pid with
                # the created string.
                while current_processes >= num_processes:
                    for i, process in enumerate (pids):
                         value = process.poll()
                         if value == 0:
                             current_processes -= 1
                             del pids[i]
                             del proc_status[i]
                             break

                x = ac['stats_fx'](subprocess_string, options.directory,
                    str(total_processes), ac)

                pids.append (x)
                proc_status.append(None)
                current_processes += 1
                total_processes += 1
                current_pairs = -1

            # Increase the counter for current pairs. When this counter is
            # equal to the variable-defined number of pairs per subprocess
            # reset the counter to 0.
            # Increase slx2 by 1
            slx2 += 1
            current_pairs += 1

    return {'proc_status': proc_status, 'pids': pids}

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
    proc_status = returned['proc_status']
    pids = returned['pids']

    while all_complete == False:
        for i, pid in enumerate(pids):
            proc_status[i] = pid.poll()
            if proc_status[i] == None or proc_status[i] == 0:
                continue
            elif proc_status[i] > 0 or proc_status[i] < 0:
                sys.exit(proc_status[i])
        all_complete = all(status == 0 for status in proc_status)

    # Fill matrix of stat_layers by stat_layers with the p-values/r-correlation
    num_layers = len(ac['stats_layers'])
    corr_vals = numpy.zeros(shape=(num_layers, num_layers))

    temp_dir_elements = os.listdir(ac['temp_dir'])
    for file_name in temp_dir_elements:
        if file_name != ac['ref_file']:
            reader = tsv.TsvReader(open(os.path.join(ac['temp_dir'], file_name), "r"))
            iterator = reader.__iter__()
            for line in iterator:
                slx1 = int(line[0])
                slx2 = int(line[1])
                val = float(line[2])

                corr_vals[slx1, slx2] = val
                corr_vals[slx2, slx1] = val

    # Delete our temporary directory.
    shutil.rmtree(ac['temp_dir'])

    #print 'corr_vals'
    #pprint.pprint(corr_vals)
    for i, row in enumerate(corr_vals):
        name = ac['stats_layers'][i]
        #if ac['type'] == 'pear':
        #    name = name[0]
        layer_index = str(layer_names.index(name))
        writer = tsv.TsvWriter(open(os.path.join(options.directory,
            'layer_' + layer_index + '_' + ac['type'] + '.tab'), 'w'))
        writer.line(*ac['stats_layers'])
        writer.line(*row)
        writer.close()

    return True

def find_means (layers, stats_layers, hex_names, ac):
    """
    Find the mean of each attribute's value in each hexagram
    @param layers: all layers
    @param stats_layers: attributes/layers to include
    @param hex_names: names of the hexagons
    @param ac: the association stats context
    @returns nothing
    Write to a file in the form:
        attr, stats-layer-index, mean
        attr, stats-layer-index, mean
        ...
    Note that we throw out NaN values
    """

    # Save to the continuous values file
    with open(os.path.join(ac['temp_dir'], ac['ref_file']), 'w') as writer:
        writer = csv.writer(writer, delimiter='\t')

        # The data structure for accessing tissue scores/layer values is:
        #   layers dict: layer name, sample-id, score/value
        # The data structure for the file written is
        #   layer-name, stats-layer-index, score, score, ...
        for index, layer_name in enumerate(stats_layers):
            layer_means = []
            layer_means.append(layer_name)
            layer_means.append(stats_layers.index(layer_name))

            # Holds the sum of continuous values for each attribute
            values = 0

            # Keep track of the number of samples that have a value
            num_val = 0
            for hex_name in hex_names:
                try:
                    score = layers[layer_name][hex_name]
                except KeyError:
                    continue
                values += score
                num_val += 1

            if (num_val > 0):
                mean_v = values/(num_val)
            else:
                mean_v = 0
            layer_means.append(mean_v)

            #print 'layer_means:', layer_means
            writer.writerow(layer_means)

    return False

def association_statistics(layers, layer_names, ctx, options):
    """
    The tool will deploy the appropriate association stat test on each
    array of layers. These tools will compute the correlation values between pairs
    of attributes.
    @param layers: the global layers object
    @param layer_names: list of all layer names
    @param ctx: global context for hexagram.py
    @param options: those options passed into hexagram.py

    The values generated from each individual stats test will be printed to
    separate files. On the clientside the user will be asked to select what type
    of value they want to correlate their selected attribute against.
    """

    temp_dir = tempfile.mkdtemp()
    hex_names_file = 'hex_names.tab'

    # Create the temporary hex names file accessed by the subprocesses
    hex_names = ctx.all_hexagons[0].values()
    writer = tsv.TsvWriter(open(os.path.join(temp_dir, hex_names_file), 'w'))
    writer.line(*hex_names)
    writer.close()

    # Run Stats on Continuous Layers.
    # Create the association statistics context.
    ac = {
        'type': 'pear',
        'stats_fx': pearson, # the stats to be run on this data
        'stats_layers': ctx.continuous_layers, # data types for these stats
        'temp_dir': tempfile.mkdtemp(), # the dir to store temporary working files
        'ref_file': 'cont_values.tab', # a temporary reference file of continuous values for these stats
    }

    # Find the mean of each continuous attribute.
    # TODO find_means(layers, ctx.continuous_layers, hex_names, ac)

    # TODO the pearson stats need to be tested & verified
    # TODO per_stats_type(layers, layer_names, 10, 100, ac, ctx, options)

    # Run Stats on binary Layers.
    # TODO Run Stats on binary & categorical Layers.
    # Create the association statistics context.
    ac = {
        'type': 'chi2',
        'stats_fx': chi2, # the stats to be run on this data
        'stats_layers': ctx.binary_layers, # data types for these stats
        # TODO 'stats_layers': ctx.binary_layers + ctx.categorical_layers, # data types for these stats
        'temp_dir': temp_dir, # the dir to store temporary working files
        'ref_file': hex_names_file, # a temporary reference file of hexagon names for these stats
    }

    per_stats_type(layers, layer_names, 10, 3600, ac, ctx, options)
    return True    
