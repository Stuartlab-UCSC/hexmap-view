"""
statsSort.py: Run the sample-based statistics.
"""
import sys, os, numpy, subprocess, shutil, tempfile, pprint
import tsv, csv, datetime, time, math, multiprocessing
import pool, traceback
from chi import chi

# Use a transition class just for parms
class ForEachLayer(object):

    def __init__(s, parm):

        # Build the output filename for precomputed stats
        if 'writeFile' in parm:
            if 'layout' in parm:
                suffix = '_' + parm['layout'] + '_rstats.tab'
            else:
                suffix = '_sstats.tab'
            filename = 'layer_' + str(parm['layerIndex']) + suffix
            s.file = os.path.join(parm['directory'], filename)

        s.alg = parm['alg']
        s.directory = parm['directory']
        s.layers = parm['layers']
        s.fileIndex = parm['fileIndex']
        s.layerNames = parm['layerNames']
        s.stats_fx = parm['stats_fx']
        s.statsLayers = parm['statsLayers']
        s.temp_dir = parm['temp_dir']
        s.hex_names_file = parm['hex_names_file']
        s.writeFile = parm['writeFile']

        s.fileIndex = parm['fileIndex']
        s.layerA = parm['layerA']
        s.layerIndex = parm['layerIndex']

        # Layout-ignore options:
        if 'layout' not in parm:
            s.algParm = ''
            s.slx1 = s.statsLayers.index(s.layerA)
            # TODO simplify ?
            if 'writeFile' in parm:
                s.slx2 = s.slx1 - 1
                s.bLayers = s.statsLayers[s.slx1:]
            else:
                s.slx2 = 0
                s.bLayers = s.statsLayers

def chi2 (subprocess_string, optionsDirectory, fileIndex, temp_dir):
    """
    The subprocess call to chi.py takes the following arguments
    args[] = 'python'
    args[0] = 'chi.py'
    args[1] = 'temp_directory' - temporary directory to print files to
    args[2] = 'subprocess_string' - string containing sets of four indices:
               layer1, layer 2, chi layer 1 chi layer 2
    args[3] = 'working_directory' - directory to which main process writes files
    args[4] = 'fileIndex' - index for names of the output file
    """
    return chi(temp_dir, subprocess_string, optionsDirectory, fileIndex)

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def chiSquared(s, layerB):

    # Increase the inner loop index by 1
    s.slx2 += 1

    # Index according to layerNames (all layers). This is needed
    # to look up the appropriate raw data file.
    lx1 = str(s.layerNames.index(s.layerA))
    lx2 = str(s.layerNames.index(layerB))

    # Join layer indices & stats layer indices (used to place the p-values
    # returned by the subprocess into the numpy matrix) by commas.
    current_string = ",".join([lx1, lx2, str(s.slx1), str(s.slx2)])

    # Initialize new subprocess string or add to the existing one
    # chaining current strings with semi-colons.

    s.algParm += ';' + current_string

def oneLayer(sctx):

    s = ForEachLayer(sctx)

    # Loop through the remainder of the layers to form pairs to compare
    for layerB in s.bLayers:

        # Call the appropriate function
        eval(s.alg)(s, layerB)

    s.stats_fx(s.algParm[1:], s.directory, str(s.fileIndex), s.temp_dir)
    if hasattr(s, 'writeFile'):
        # TODO read the temp file, match it's indices and print it
        pass

def stats_looper(
    layer_names, # args RO
    layers,
    sctx, # stats context
    options): # statistical function  RO

    # Counter for total processes. This will index the output files
    # from the stats function.
    fileIndex = 0

    # Loop through the layers for the data types of interest, creating strings
    # that will be passed to the stats subprocess. First group layer indices of
    # attributes to be compared, separated by commas. Then append additional
    # index groups, separated by semi-colons.
    # slx = stats layer index, lx = global layer index
    #for slx1, layer_name1 in enumerate (sctx['stats_layers']):
    parm = {
        'alg': 'chiSquared',
        'directory': options.directory,
        'layers': layers,
        'fileIndex': fileIndex,         ####### needed for writing temporary files
        'layerNames': layer_names,       ####### TODO transitional ?
        'stats_fx': sctx['stats_fx'],   ####### TODO transitional
        'statsLayers': sctx['stats_layers'],
        'temp_dir': sctx['temp_dir'],
        'hex_names_file': sctx['hex_names_file'],
        'writeFile': True,
    }

    print 'layer_names:', layer_names

    for slx1, layer_name1 in enumerate (sctx['stats_layers']):
    #for slx1, layer_name1 in enumerate (['TP53_mutated']):
        parm['fileIndex'] = fileIndex
        parm['layerA'] = layer_name1
        parm['layerIndex'] = layer_names.index(layer_name1)
        parm['slx1'] = slx1
        oneLayer(parm)

        fileIndex += 1

    """
    # Handle the stats for each layer, in parallel
    allLayers = []
    for layer in parm['statsLayers']:
        parm['layerA'] = layer
        parm['layerIndex'] = layerNames.index(layer)
        allLayers.append(ForEachLayer(parm))

    print pool.hostProcessorMsg()
    print len(ctx.binary_layers), 'subprocesses to run.'

    pool.runSubProcesses(allLayers)

    print timestamp(), 'Stats complete for layout:', layout

    """

def per_stats_type (layers, layer_names, num_layers, sctx, options):
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

    stats_looper (
        layer_names,
        layers,
        sctx,
        options)

    # Fill matrix with stat_layers and their values
    print timestamp(), 'Populating the value matrix for sample-based stats'
    sys.stdout.flush()
    vals = numpy.zeros(shape=(num_layers, num_layers))

    dir_elements = os.listdir(sctx['temp_dir'])
    layer_count = len(dir_elements) -1 # num of attributes
    value_total = (layer_count**2 + layer_count) / 2 # number of unique values in the table
    value_count = 0
    for file_name in iter(dir_elements):
        if file_name != sctx['hex_names_file']:
            reader = tsv.TsvReader(open(os.path.join(sctx['temp_dir'], file_name), "r"))
            for line in reader.__iter__():
                slx1 = int(line[0])
                slx2 = int(line[1])
                val = float(line[2])

                vals[slx1, slx2] = val
                vals[slx2, slx1] = val
                value_count += 1

    # Delete our temporary directory.
    #shutil.rmtree(sctx['temp_dir']) # TODO this should be done after we're sure it's not needed

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
    with open(os.path.join(sctx['temp_dir'], sctx['hex_names_file']), 'w') as writer:
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

def statsSort(layers, layer_names, ctx, options):
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
    pool.hostProcessorMsg()

    # Run Stats on binary Layers.
    # TODO Run Stats on binary & categorical Layers

    if ctx.binary_layers == 0:
        print('No binary layers for chi2 to process')
        return True

    # Create the statistics context.
    num_layers = len(ctx.binary_layers)
    sctx = {
        'type': 'chi2',
        'stats_fx': chi2, # the stats to be run on this data
        'stats_layers': ctx.binary_layers, # data types for these stats
        # TODO 'stats_layers': ctx.binary_layers + ctx.categorical_layers, # data types for these stats
        'temp_dir': temp_dir, # the dir to store temporary working files
        'hex_names_file': hex_names_file, # a temporary reference file of hexagon names for these stats
     }

    print timestamp(), "Processing", num_layers, "layers"

    per_stats_type(layers, layer_names, num_layers, sctx, options)

    print timestamp(), "Sample-based statistics complete"

    return True    
