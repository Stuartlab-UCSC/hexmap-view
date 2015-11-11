"""
statsSort.py: Run the sample-based statistics.
"""
import sys, os, numpy, subprocess, shutil, tempfile, pprint
import tsv, csv, datetime, time, math, multiprocessing
import pool, traceback
from statsSortLayer import ForEachLayer

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def subprocessPerLayer(layers, layer_names, sctx, options):

    # Spawn the subprocesses to calculate stats for each layer
    parm = {
        'alg': 'chi2',
        'directory': options.directory,
        'hexNames': sctx['hexNames'],
        'layers': layers,
        'statsLayers': sctx['statsLayers'],
        'temp_dir': sctx['temp_dir'],
        'writeFile': True,
    }

    # The number of pairs to compare including compare to self
    pairCount = len(parm['statsLayers']) ** 2
    print 'Starting to build', pairCount, 'layer pairs...'

    # Handle the stats for each layer, in parallel
    allLayers = []
    for layerA in parm['statsLayers']:
        parm['layerA'] = layerA
        parm['layerIndex'] = layer_names.index(layerA)
        allLayers.append(ForEachLayer(parm))

    print pool.hostProcessorMsg()
    print len(parm['statsLayers']), 'subprocesses to run, one per layer.'
    pool.runSubProcesses(allLayers)

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

    subprocessPerLayer(layers, layer_names, sctx, options)

    # Fill matrix with stat_layers and their values
    print timestamp(), 'Populating the value matrix for sample-based stats'
    sys.stdout.flush()
    vals = numpy.zeros(shape=(num_layers, num_layers))
    for file_name in iter(os.listdir(sctx['temp_dir'])):
        reader = tsv.TsvReader(open(os.path.join(sctx['temp_dir'], file_name), "r"))
        for line in reader.__iter__():
            slx1 = sctx['statsLayers'].index(line[0])
            slx2 = sctx['statsLayers'].index(line[1])
            val = float(line[2])

            vals[slx1, slx2] = val
            vals[slx2, slx1] = val

    # Delete our temporary directory.
    shutil.rmtree(sctx['temp_dir'])

    print timestamp(), 'Writing the files for sample-based stats'
    sys.stdout.flush()

    for i, row in enumerate(vals):
        name = sctx['statsLayers'][i]
        layer_index = str(layer_names.index(name))
        
        # File names are like: layer_9_sstat.tab
        writer = tsv.TsvWriter(open(os.path.join(options.directory,
            'stats_' + layer_index + '.tab'), 'w'))
        writer.line(*sctx['statsLayers'])
        writer.line(*row)
        writer.close()

    # Gather any empty layer indices and log them
    filePath = os.path.join(options.directory, 'empty_layers.tab')
    if os.path.exists(filePath):
        empty_layers = set()
        with open(filePath, 'rU') as f:
            value_iterator = f.__iter__()
            for j, layer in enumerate(value_iterator):
                empty_layers.add(layer)
        os.remove(file)
        print 'WARNING: No values in these layers:', list(empty_layers)

    return True

def find_means (layers, statsLayers, hexNames, sctx):
    """
    Find the mean of each attribute's value in each hexagram
    @param layers: all layers
    @param statsLayers: attributes/layers to include
    @param hexNames: names of the hexagons
    @param ac: the association stats context
    @returns nothing
    Write to a file in the form:
        attr, stats-layer-index, mean
        attr, stats-layer-index, mean
        ...
    Note that we throw out NaN values
    """

    # Save to the continuous values file
    # TODO hex_names_file is not correct here. we probably meant something like 'means'
    with open(os.path.join(sctx['temp_dir'], sctx['hex_names_file']), 'w') as writer:
        writer = csv.writer(writer, delimiter='\t')

        # The data structure for accessing tissue scores/layer values is:
        #   layers dict: layer name, sample-id, score/value
        # The data structure for the file written is
        #   layer-name, stats-layer-index, score, score, ...
        for index, layer_name in enumerate(statsLayers):
            layer_means = []
            layer_means.append(layer_name)
            layer_means.append(statsLayers.index(layer_name))

            # Holds the sum of continuous values for each attribute
            values = 0

            # Keep track of the number of samples that have a value
            num_val = 0
            for hex_name in hexNames:
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

    # Create the hex names file accessed by the subprocesses
    hexNames = ctx.all_hexagons[0].values()
    writer = tsv.TsvWriter(open(os.path.join(options.directory, 'hexNames.tab'), 'w'))
    writer.line(*hexNames)
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
        'statsLayers': ctx.binary_layers, # data types for these stats
        # TODO 'statsLayers': ctx.binary_layers + ctx.categorical_layers, # data types for these stats
        'temp_dir': tempfile.mkdtemp(), # the dir to store temporary working files
        'hexNames': hexNames, # a list of all hexagon names
     }

    print timestamp(), "Processing", num_layers, "layers"

    per_stats_type(layers, layer_names, num_layers, sctx, options)

    print timestamp(), "Sample-based statistics complete"

    return True    
