"""
sampleBaseStats.py: Run the sample-based statistics.
"""
import sys, os, numpy, subprocess, shutil, tempfile, pprint
import tsv, csv, datetime, time, math, multiprocessing
import pool, traceback

def pearson (subprocess_string, optionsDirectory, total_processes, sctx):
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
    return subprocess.Popen(['python', 'pearson.py', sctx['temp_dir'], subprocess_string, str(total_processes)])

def chi2 (subprocess_string, optionsDirectory, total_processes, sctx):
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
    return subprocess.Popen(['python', 'chi.py', sctx['temp_dir'], subprocess_string, optionsDirectory, total_processes])

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def wait_for_free_process(procs, max_processes):
    # Loop while the number of current processes is greater then the allowed
    # number. Poll each process until current process count is >= allowed count.
    # Remove successfully completed processes

    while len(procs) >= max_processes:
        time.sleep(1)
        success_index = -1
        for i, proc in enumerate (procs):
            status = proc.poll()
            if status == None: # not complete
                continue
            if status == 0: # success
                success_index = i
                break

            # The process has completed with a return code
            traceback.print_exc()
            sys.exit(status)

        if success_index > -1:
            del procs[success_index]
    return procs

def stats_looper (
    layer_names, # args RO
    num_processes, # args max_processes RO
    num_pairs, # args max_pairs  RO
    sctx, # stats context
    ctx, # hexagram context
    options): # statistical function  RO

    # Counter to chain together a variable number of layer combinations
    # for subprocesses
    current_pairs = 0

    # Sum of pairs processed for this test type
    sum_pairs = 0
    pair_message_count = 1

    # List of process handles
    procs = []

    # Counter for total processes. This will index the output files
    # from the stats function.
    total_processes = 0

    # Loop through the layers for the data types of interest, creating strings
    # that will be passed to the stats subprocess. First group layer indices of
    # attributes to be compared, separated by commas. Then append additional
    # index groups, separated by semi-colons.
    # slx = stats layer index, lx = global layer index
    for slx1, layer_name1 in enumerate (sctx['stats_layers']):
        slx2 = slx1 - 1

        # Loop through the remainder of the layers to form pairs to compare
        for layer_name2 in sctx['stats_layers'][slx1:]:

            # Increase the current pairs-counter
            current_pairs += 1

            # Increase the inner loop index by 1
            slx2 += 1

            # Index according to layer_names (all layers). This is needed
            # to look up the appropriate raw data file.
            lx1 = str(layer_names.index(layer_name1))
            lx2 = str(layer_names.index(layer_name2))

            # Join layer indices & stats layer indices (used to place the p-values
            # returned by the subprocess into the numpy matrix) by commas.
            current_string = ",".join([lx1, lx2, str(slx1), str(slx2)])

            # Initialize new subprocess string or add to the existing one
            # chaining current strings with semi-colons.
            if (current_pairs == 1):
                subprocess_string = current_string
            else:
                subprocess_string = ";".join([subprocess_string, current_string])

            # Submit the job if we've reach our max pairs-per-process
            # or the end of the layer-1's data
            if (current_pairs >= num_pairs) or (layer_name2 == sctx['stats_layers'][-1]):
                procs = wait_for_free_process(procs, num_processes)

                procs.append(sctx['stats_fx'](
                                subprocess_string, options.directory,
                                str(total_processes), sctx
                            ))
                total_processes += 1
                sum_pairs += current_pairs
                current_pairs = 0

        # Log a progress message for every ~1/30th of pairs processed
        if sum_pairs >= sctx['total_pairs'] * pair_message_count / 30:
            print timestamp(), str(pair_message_count) + '/30 of', sctx['total_pairs'], 'pairs'
            sys.stdout.flush()
            pair_message_count += 1

    return procs

def per_stats_type (layers, layer_names, num_processes, num_pairs, sctx, ctx, options):
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

    procs = stats_looper (
        layer_names,
        num_processes,
        num_pairs,
        sctx,
        ctx,
        options)

    # When we reach here, all processes have been submitted and we're just
    # waiting for the last bunch to finish
    print timestamp(), 'Waiting for the last jobs to complete for sample-based stats'
    sys.stdout.flush()
    wait_for_free_process (procs, 1)

    # Fill matrix with stat_layers and their values
    print timestamp(), 'Populating the value matrix for sample-based stats'
    sys.stdout.flush()
    num_layers = len(sctx['stats_layers'])
    vals = numpy.zeros(shape=(num_layers, num_layers))

    dir_elements = os.listdir(sctx['temp_dir'])
    layer_count = len(dir_elements) -1 # num of attributes
    value_total = (layer_count**2 + layer_count) / 2 # number of unique values in the table
    value_count = 0
    for file_name in iter(dir_elements):
        if file_name != sctx['ref_file']:
            reader = tsv.TsvReader(open(os.path.join(sctx['temp_dir'], file_name), "r"))
            for line in reader.__iter__():
                slx1 = int(line[0])
                slx2 = int(line[1])
                val = float(line[2])

                vals[slx1, slx2] = val
                vals[slx2, slx1] = val
                value_count += 1

    # Delete our temporary directory.
    shutil.rmtree(sctx['temp_dir'])

    print timestamp(), 'Writing the files for sample-based stats'
    sys.stdout.flush()

    written_count = 0
    for i, row in enumerate(vals):
        name = sctx['stats_layers'][i]
        layer_index = str(layer_names.index(name))
        
        # File names are like: layer_9_sstat.tab
        writer = tsv.TsvWriter(open(os.path.join(options.directory,
            'layer_' + layer_index + '_sstats.tab'), 'w'))
        writer.line(*sctx['stats_layers'])
        writer.line(*row)
        writer.close()
        written_count += 1

    # Gather any empty layer indices and log them
    empty_layers = set()
    for i in range(0, len(layer_names)):
        try:
            file = os.path.join(options.directory, 'empty_layers_' + str(i) + '.tab')
            with open(file, 'rU') as f:
                f = csv.reader(f, delimiter='\t')
                value_iterator = f.__iter__()
                for j, layer in enumerate(value_iterator):
                    empty_layers.add(layer[0])

            os.remove(file)

        except:
            pass

    if len(list(empty_layers)) > 0:
        print 'WARNING: No values in these layers:', list(empty_layers)

    return True

def find_means (layers, stats_layers, hex_names, sctx):
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
    with open(os.path.join(sctx['temp_dir'], sctx['ref_file']), 'w') as writer:
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

            writer.writerow(layer_means)

    return False

def sample_based_statistics(layers, layer_names, ctx, options):
    """
    The tool will deploy the appropriate association stat test on each
    array of layers. These tools will compute the correlation values between pairs
    of attributes.
    @param layers: the global layers object
    @param layer_names: list of layer names for these stats
    @param ctx: global context for hexagram.py
    @param options: those options passed into hexagram.py

    The values generated from each individual stats test will be printed to
    separate files. On the clientside the user will be asked to select what type
    of value they want to correlate their selected attribute against.
    """

    print timestamp(), "Running sample-based statistics..."

    temp_dir = tempfile.mkdtemp()
    hex_names_file = 'hex_names.tab'

    # Create the temporary hex names file accessed by the subprocesses
    hex_names = ctx.all_hexagons[0].values()
    writer = tsv.TsvWriter(open(os.path.join(temp_dir, hex_names_file), 'w'))
    writer.line(*hex_names)
    writer.close()

    MAX_JOB_COUNT = pool.max_job_count()

    print 'Using', MAX_JOB_COUNT, 'processors for parallel jobs'

    """ 
    Ignore these stats for now
    # Run Stats on Continuous Layers.
    # Create the association statistics context.
    sctx = {
        'type': 'pear',
        'stats_fx': pearson, # the stats to be run on this data
        'stats_layers': ctx.continuous_layers, # data types for these stats
        'temp_dir': tempfile.mkdtemp(), # the dir to store temporary working files
        'ref_file': 'cont_values.tab', # a temporary reference file of continuous values for these stats
    }

    # Find the mean of each continuous attribute.
    # TODO find_means(layers, ctx.continuous_layers, hex_names, sctx)

    # TODO the pearson stats need to be tested & verified
    # print str(len(ctx.continuous_layers) ** 2), "Continuous pairs to run for sample-based stats"
    # TODO per_stats_type(layers, layer_names, MAX_JOB_COUNT, 100, ac, ctx, options)
    """

    # Run Stats on binary Layers.
    # TODO Run Stats on binary & categorical Layers

    if ctx.binary_layers == 0:
        print('No binary layers for chi2 to process')
        return True

    # Create the statistics context.
    total_pairs = reduce(lambda x, y: x+y, range(len(ctx.binary_layers) + 1))
    sctx = {
        'type': 'chi2',
        'stats_fx': chi2, # the stats to be run on this data
        'stats_layers': ctx.binary_layers, # data types for these stats
        # TODO 'stats_layers': ctx.binary_layers + ctx.categorical_layers, # data types for these stats
        'temp_dir': temp_dir, # the dir to store temporary working files
        'ref_file': hex_names_file, # a temporary reference file of hexagon names for these stats
        'total_pairs': total_pairs,
     }

    print timestamp(), "Processing the", total_pairs, "binary pairs"

    per_stats_type(layers, layer_names, MAX_JOB_COUNT, 3600, sctx, ctx, options)

    print timestamp(), "Sample-based statistics complete"

    return True    
