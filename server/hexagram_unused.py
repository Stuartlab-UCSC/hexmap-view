# these are unused functions that were in hexagram.py
# save them in case we want them later

"""
def continuous_window_values(layers, layer_names, curated_windows):
    # This tool will generate a list of attributes (layers). Each element
    # in this list will contain a list, containing 3 types of values. The first
    # type of value will be a string containing the layer/attribute name.
    # The second type of value will be the index of the layer within continuous_layers.
    # The third type of value will be the mean value of the continuous values
    # for the samples in that window.

    # NOTE: TODO: This routine is not currently being used and may have only
    # been intended for association stats, but those are sample-based,
    # so should not be windowed.

    # At the moment we will be hardcoding the map for which windowing and other
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
"""
"""
TODO unused function
def pearson_corr_2 (cont_values, layer_names, options, num_processes, num_pairs):
    # This tool will compute pearson correlation coefficients and p-values
    # using two attributes from cont_layers. This tool will run the scipy
    # stats calculation utilizing a series of subprocesses initiated via
    # the popen module and the pearson.py code.
    #
    # The pearson.py will take several arguments (popen only takes strings):
    #
    # args[] = 'python'
    # args[0] = 'pearson.py'
    # args[1] = 'temp_directory' - temporary directory to print files to
    # args[2] = 'subprocess_string' - string containing sets of four values.
    #            The four value are "layer1 index, layer 2 index, cont layer 1
    #            index, cont layer 2 index;..."
    # args[3] = 'total_processes'- current number of processes which is used
               by the subprocess as the index for the printed file

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

    timestamp();
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
    timestamp();
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
"""
