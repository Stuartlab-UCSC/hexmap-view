"""
statsSort.py: Run the sample-based statistics.
"""
import sys, os, numpy, subprocess, shutil, tempfile, pprint
import tsv, csv, datetime, time, math, multiprocessing
import pool, traceback
from statsSortLayer import ForEachLayer

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def writeValues (layers, layer_names, num_layers, parm, options):

    # Aggregate the data into a matrix and write the values to files.

    # Aggregate the data into a matrix of statsLayers by statsLayers
    print timestamp(), 'Populating the value matrix for sample-based stats'
    sys.stdout.flush()
    vals = numpy.zeros(shape=(num_layers, num_layers))
    for file_name in iter(os.listdir(parm['temp_dir'])):
        reader = tsv.TsvReader(open(os.path.join(parm['temp_dir'], file_name), "r"))
        for line in reader.__iter__():
            slx1 = parm['statsLayers'].index(line[0])
            slx2 = parm['statsLayers'].index(line[1])
            val = float(line[2])

            vals[slx1, slx2] = val
            vals[slx2, slx1] = val

    # Delete our temporary directory.
    shutil.rmtree(parm['temp_dir'])

    # Write all the stats files
    print timestamp(), 'Writing the files for sample-based stats'
    sys.stdout.flush()
    
    for i, row in enumerate(vals):
        name = parm['statsLayers'][i]
        layer_index = str(layer_names.index(name))
        
        # File names are like: layer_9_sstat.tab
        writer = tsv.TsvWriter(open(os.path.join(options.directory,
            'stats_' + layer_index + '.tab'), 'w'))
        writer.line(*parm['statsLayers'])
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

def subprocessPerLayer(layer_names, parm):

    # Spawn the subprocesses to calculate stats for each layer
    # The number of pairs to compare including compare to self
    pairCount = len(parm['statsLayers']) ** 2
    pool.hostProcessorMsg()
    print 'Starting to build', pairCount, 'layer pairs...'

    """
    # TODO easy testing without subprocesses
    for layerA in parm['statsLayers']:
        parm['layerA'] = layerA
        parm['layerIndex'] = layer_names.index(layerA)
        oneLayer = ForEachLayer(parm)
        oneLayer()
    """

    # Handle the stats for each layer, in parallel
    allLayers = []
    for layerA in parm['statsLayers']:
        parm['layerA'] = layerA
        parm['layerIndex'] = layer_names.index(layerA)
        allLayers.append(ForEachLayer(parm))

    print pool.hostProcessorMsg()
    print len(parm['statsLayers']), 'subprocesses to run, one per layer.'
    pool.runSubProcesses(allLayers)

def statsSort(layers, layer_names, ctx, options):
    """
    The tool will deploy the appropriate association stat test on each
    array of layers, computing the p-value between pairs of attributes.
    @param layers: the global layers object
    @param layer_names: list of layer names to be included in these stats
    @param ctx: global context for hexagram.py
    @param options: those options passed into hexagram.py

    The values generated from each individual stats test will be printed to
    separate files. On the client-side the user will be asked to select what 
    types of values they want to correlate their selected attribute against.
    """
    
    print timestamp(), "Running sample-based statistics..."

    # Create the hex names file accessed by the subprocesses
    hexNames = ctx.all_hexagons[0].values()
    writer = tsv.TsvWriter(open(os.path.join(options.directory, 'hexNames.tab'), 'w'))
    writer.line(*hexNames)
    writer.close()

    # Consider all data types for pre-computed stats
    statsLayers = ctx.binary_layers \
        + ctx.categorical_layers \
        + ctx.continuous_layers

    # Create the parameters to pass to the subprocesses.
    parm = {
        'hexNames': hexNames, # a list of all hexagon names
        'layers': layers, # all layers
        'directory': options.directory,
        'statsLayers': statsLayers,
        'binLayers': ctx.binary_layers,
        'catLayers': ctx.categorical_layers,
        'contLayers': ctx.continuous_layers,
        'temp_dir': tempfile.mkdtemp(), # the dir to store temporary working files,
        'writeFile': True,
    }

    # Spawn the layer processes
    num_layers = len(parm['statsLayers'])
    print timestamp(), "Processing", num_layers, "layers"
    subprocessPerLayer(layer_names, parm)

    # Save the values to files
    writeValues(layers, layer_names, num_layers, parm, options)

    print timestamp(), "Sample-based statistics complete"

    return True    
