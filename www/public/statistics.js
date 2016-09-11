// statistics.js: Web Worker file to run statistical tests in the background.

//var app = app || {}; 

//(function (hex) {
    //'use strict';

// Constants:
// How many pseudocount trials should we use for the binomial test?
var BINOMIAL_PSEUDOCOUNTS = 5;

// Should we log information about suspicious p values to the console for manual
// spot checking?
var LOG_SUSPICIOUS = false;

// Go get jStat (the one from <https://github.com/jstat/jstat>, which is better
// than the other project, also named jStat, that we used to use). Hope it's
// happy in Worker-land.
importScripts("jstat.js");

self.onmessage = function(message) {
    // Handle incoming messages from the page. Each message's data is an RPC
    // request, with "name" set to a function name, "args" set to an array of
    // arguments, and "id" set to an ID that should be returned with the return
    // value in a reply message. If the function call fails, an error is sent
    // back.

    debug('onmessage()');
   self.postMessage({
        log: 'WTF'
    });


    // Set the id for progress notifications (since we only run one message at a
    // time in a worker).
    progress.id = message.data.id;
    
    try {
        // Go get the specified global function, and apply it on the given
        // arguments. Use the global scope ("self") as its "this".
        var return_value = self[message.data.name].apply(self, 
            message.data.args);
        
    } catch(exception) {
    
        // Send the error back to the page instead of a return value.
        // Unfortunately, errors themselves can't be cloned, so we do all the
        // message making here and send back a string.
        
        // First we build a string with all the parts of the error we can get.
        var error_message = "Error in web worker doing job " + message.data.id;
        error_message += "\n";
        error_message += exception.name + ": " + exception.message;
        error_message += "\n";
        error_message += "Full details:\n";
        for(field in exception) {
            if(field == "name" || field == "message") {
                // Already got these.
                continue;
            }
            
            // Copy the field into the message as a string.
            error_message += field + ": " + exception[field] + "\n";
        }
        error_message += "Call: " + message.data.name + "(";
        for(var i = 0; i < message.data.args.length; i++) {
            error_message += message.data.args[i];
            if(i + 1 < message.data.args.length) {
                // Have an argument after this.
                error_message += ", ";
            }
        }
        error_message += ")";

       self.postMessage({
            id: message.data.id,
            error: error_message
        });
        
        return;
    }
    
    
    // Send the return value back with the id.
   self.postMessage({
        id: message.data.id,
        return_value: return_value
    });
}

function print(message) {
    // Print a message to the console of the parent page.
   self.postMessage({
        log: message
    });
}

function debug(message) {
    self.postMessage({type: 'debug', message: message});
    //postMessage(JSON.stringify({type:'debug',message:message}));
}

function progress(amount) {
    // Set the progress abr on the page to the given portion full.  It comes
    // with an ID that onmessage sets on this function.

    debug('progress()');

    self.postMessage({
        id: progress.id,
        progress: amount
    });
}

function statistics_for_matrix(matrix_url, in_list, out_list, all_list) {
    // Download the given score matrix, do stats between in_list and out_list
    // for each layer in it, and return an object from layer name to p value.
    // all_list specifies the names of all signatures that figure into the
    // analysis at all.
    
    // Download the matrix synchronously. 
    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synch
    // ronous_and_Asynchronous_Requests
    // A side effect of this is that we won't have more simultaneous downloads 
    // than workers, which is probably good.
    // This holds the request.

    debug('statistics_for_matrix()');

    var request = new XMLHttpRequest();
    // Get the layer data by GET. The false makes it synchronous.
    request.open("GET", matrix_url, false);
    request.send(null);
    
    // Now we have the layer TSV
    // But we don't have our fancy jQuery TSV parser. Parse it manually.
    
    // This holds an object of layer data objects (from signature to float) by
    // layer name.
    layers = {};

    // This holds the array of lines
    // Split on newlines (as seen in jQuery.tsv.js)
    var lines = request.responseText.split(/\r?\n/);

	// Make sure to remove any lines that start with '#'
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf("#") < 0){
			lines = lines.splice(i);
			break;
		}		
	}

    // Line 0 gives all the layer names, but the first thing isn't a layer name
    // (since it's above the signature column).
    var layer_names = lines[0].split(/\t/);
    for(var i = 1; i < layer_names.length; i++) {
        // Make sure we have an object for this layer
        layers[layer_names[i]] = {};
    }
    
    // The rest give values per layer for the hex in column 1.
    for(var i = 1; i < lines.length; i++) {
        // This holds the parts of each line
        var parts = lines[i].split(/\t/);
        
        if(parts[0]) {
            // We actually have data
            
            // Get the singature
            var signature = parts[0];
            
            for(var j = 1; j < parts.length; j++) {
                // Go through each non-signature entry and set the appropriate
                // layer's value for this signature.
                layers[layer_names[j]][signature] = parseFloat(parts[j]);
            }
        }
    }
    
    // Now we've parsed the matrix.
    // Go do stats for each layer.
    // This holds our calculated p value by layer name.
    var p_values = {};
    
    print("Running statistics for (up to) " + layer_names.length + 
        " layers from matrix " + matrix_url);
    
    progress(0);
    
    for(var i = 1; i < layer_names.length; i++) {
        // Pass the layer data to the per-layer statistics, and get the p value
        // back. It's probably easier to do this in this worker than to go
        // invoke more workers.
        p_values[layer_names[i]] = statistics_for_layer(layers[layer_names[i]],
            in_list, out_list, all_list);
            
        progress(i / layer_names.length);
    }
    
    progress(1);
    
    // We've now calculated a p value for every layer in the matrix. Return the
    // calculated p values labeled by layer.
    return p_values;
    
}

function statistics_for_layer(layer_data, in_list, out_list, all_list) {
    // Run the appropriate statistical test for the passed layer data, between
    // the given in and out arrays of signatures. all_list specifies the names
    // of all signatures that figure into the analysis at all. Return the p
    // value for the layer, or NaN if no p value could be calculated.


    debug('statistics_for_layer()');

    // This holds whether the layer is discrete
    var is_discrete = true;
    
    // This holds whether the layer is binary
    var is_binary = true;
    
    for(var signature in layer_data) {
        if(layer_data[signature] > 1 || layer_data[signature] < 0) {
            // Not a binary layer
            is_binary = false;
        }
        
        if(layer_data[signature] % 1 !== 0) {
            // It's a float
            is_binary = false;
            is_discrete = false;
        }
    }
    
    if(is_binary) {
        // This is a binary/dichotomous layer, so run a hypergeometric test.
        return hypergeometric_compare(layer_data, in_list, out_list, all_list);
    } else if (is_discrete) {
        // This is a multinomial/categorical layer    
        // TODO: statistics for discrete non-binary layers
        return NaN;
    } else {
        // This is a continuous layer, so run a t test
        return t_compare(layer_data, in_list, out_list, all_list);
    }

}

/* TODO unused
function statistics_for_url(layer_url, in_list, out_list, all_list) {
    // Run the stats for the layer with the given url, between the given in and
    // out arrays of signatures. all_list specifies the names of all signatures
    // that figure into the analysis at all. Return the p value for the layer,
    // or NaN if no p value could be calculated.
    

    debug('statistics_for_url()');

    print("Running statistics for individual layer " + layer_url);
    
    // Download the layer data synchronously. 
    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synch
    // ronous_and_Asynchronous_Requests
    // A side effect of this is that we won't have more simultaneous downloads 
    // than workers, which is probably good.
    // This holds the request.
    var request = new XMLHttpRequest();
    // Get the layer data by GET. The false makes it synchronous.
    request.open("GET", layer_url, false);
    request.send(null);
    
    // Now we have the layer TSV
    // But we don't have our fancy jQuery TSV parser. Parse it manually.
    
    // This holds the layer data (signature to float)
    var layer_data = {}

    // This holds the array of lines
    // Split on newlines (as seen in jQuery.tsv.js)
    var lines = request.responseText.split(/\r?\n/);

	// Make sure to remove any lines that start with '#'
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf("#") < 0){
			lines = lines.splice(i);
			break;
		}		
	}
    
    for(var i = 0; i < lines.length; i++) {
        // This holds the parts of each line
        var parts = lines[i].split(/\t/);
        
        if(parts[0]) {
            // We actually have data
            // Parse the layer value for this signature
            var value = parseFloat(parts[1]);
            
            // Store the value in the layer data
            layer_data[parts[0]] = value;
        }
    }
    
    // Run stats on the downloaded data
    return statistics_for_layer(layer_data, in_list, out_list, all_list);
}
*/

function t_compare(layer_data, in_list, out_list, all_list) {
    // Given the data of a continuous layer object (an object from signature
    // name to float (or undefined)), and arrays of the names of "in" and "out"
    // signatures, do a t test test for whether the in signatures differ from
    // the out signatures. Returns an object of metadata, with "p_value" set to
    // either the p value of the test (two-tailed), or NaN if the test cannot be
    // performed (due to, e.g. fewer than 2 samples in one category).
    

    debug('t_compare()');

    // Go through the in list and calculate all the summary statistics
    // How many non-NaN values?
    var number_in = 0;
    // What is the sum?
    var sum_in = 0;
    
    for(var i = 0; i < in_list.length; i++) {
        if(!isNaN(layer_data[in_list[i]])) {
            number_in++;
            sum_in += layer_data[in_list[i]];
        }
    }
    
    // We've done one pass, so we know if we have any in list data actually
    if(number_in < 2) {
        // Not enough to run the t test
        return NaN;
    }
    
    // What is the mean?
    var mean_in = sum_in / number_in;
    
    // What is the second moment (sum of squares of differences from the mean)
    var second_moment_in = 0;
    for(var i = 0; i < in_list.length; i++) {
        if(!isNaN(layer_data[in_list[i]])) {
            second_moment_in += Math.pow(layer_data[in_list[i]] - mean_in, 2);
        }
    }
    
    // What is the unbiased variance?
    unbiased_variance_in = second_moment_in / (number_in - 1);
    
    // Now go through the same process for the out list
    // How many non-NaN values?
    var number_out = 0;
    // What is the sum?
    var sum_out = 0;
    
    for(var i = 0; i < out_list.length; i++) {
        if(!isNaN(layer_data[out_list[i]])) {
            number_out++;
            sum_out += layer_data[out_list[i]];
        }
    }
    
    // We've done one pass, so we know if we have any out list data actually
    if(number_out < 2) {
        // Not enough to run the t test
        return NaN;
    }
    
    // What is the mean?
    var mean_out = sum_out / number_out;
    
    // What is the second moment (sum of squares of differences from the mean)
    var second_moment_out = 0;
    for(var i = 0; i < out_list.length; i++) {
        if(!isNaN(layer_data[out_list[i]])) {
            second_moment_out += Math.pow(layer_data[out_list[i]] - mean_out, 
                2);
        }
    }
    
    // What is the unbiased variance?
    unbiased_variance_out = second_moment_out / (number_out - 1);
    
    // We can't do the test if both variances are 0
    if(unbiased_variance_in == 0 && unbiased_variance_out == 0) {
        return NaN;
    }
    
    // Now we can calculate the t test two-tailed p value
    var p_value = t_test(mean_in, unbiased_variance_in, number_in, mean_out, 
        unbiased_variance_out, number_out);
        
    // And return it in a dict with other metadata.
    // We don't really have any other metadata.
    return {
        p_value: p_value
    };
}

function t_test(mean_in, unbiased_variance_in, number_in, mean_out, 
    unbiased_variance_out, number_out) {

    // Given the mean, unbiased variance, and number of samples for both the in
    // group and the out group, compute the p value for the t test with unequal
    // sample sizes and unequal variances, testing to see whether the means
    // differ (a two-tailed "Welch's" t test). See
    // https://en.wikipedia.org/wiki/Student%27s_t-test
    // Assumes we have enough samples to actually perform the test.
    

    debug('t_test()');

    // First, calculate the t statistic, which is where our observations fall on
    // the t distribution.
    var t_statistic = (mean_in - mean_out) / Math.sqrt((unbiased_variance_in /
        number_in) + (unbiased_variance_out / number_out));
        
        
    // Calculate the degrees of freedom for the particular t distribution that
    // we ought to compare the statistic against
    var degrees_of_freedom = Math.pow((unbiased_variance_in / number_in) + 
        (unbiased_variance_out / number_out), 2) / 
        ((Math.pow(unbiased_variance_in / number_in, 2) / (number_in - 1)) + 
        (Math.pow(unbiased_variance_out / number_out, 2) / (number_out - 1)));

    // Now we have to compare the t statistic to the t test CDF available via
    // the jStat.studentt.cdf function.
    
    // Make the t statistic be on the low side of the distribution, and
    // calculate the lower tail's area using the CDF.
    var one_tail_probability = jStat.studentt.cdf(0 - Math.abs(t_statistic), 
        degrees_of_freedom);
        
    // Return the two-tailed p value, which, since the t distribution is
    // symmetric, is just twice the single-tail probability
    return 2 * one_tail_probability;
     
}

function hypergeometric_compare(layer_data, in_list, out_list, all_list) {
    // Given the data of a binary layer object (an object from signature name to
    // 0 or 1 (or undefined)), and arrays of the names of "in" and "out"
    // signatures (with no repeats within a list), as well as an array of all
    // signature names (which is ignored), do a hypergeometric test for whether
    // the in signatures differ from the out signatures. Returns an object of
    // metadata, with "p_value" set to either the p value of the test (two-
    // tailed), or NaN if the test cannot be performed.
    
    // Hypergeometric test
    // Successes = number of 1s in in-group
    // Draws = number of signatures in in-group
    // Population size = size of union of in-group and out-group
    // Total available successes in population = number of 1s in that union
    

    debug('hypergeometric_compare()');

    // What signatures are in the union of the in-group and the out-group?
    // Object maps from signature to true.
    var union = {};
    
    // How many of those are there?
    var union_size = 0;
    
    // How many of those are 1s?
    union_yes = 0;
    
    // How many 1s are in the in-group?
    var inside_yes = 0;
    
    // And in the out-group?
    var outside_yes = 0;
    
    // How many things total are in the in-group? Assumes no repeats in the
    // in_list.
    var draws = in_list.length;
    
    for(var i = 0; i < in_list.length; i++) {
        // For everything in the in-group
        
        if(union.hasOwnProperty(in_list[i])) {
            // We should never observe a repeat here.
            print("Error: repeat of " + in_list[i]);
            return;
        }
        
        // Put it in the union
        union[in_list[i]] = true;
        union_size++;
        
        if(layer_data[in_list[i]] === 1) {
            // Count it if it was a success as a success in the union.
            union_yes++;
            
            // And the in-group
            inside_yes++;
        }
    }
    
    for(var i = 0; i < out_list.length; i++) {
        // For everything in the out-group
        
        if(!union.hasOwnProperty(out_list[i])) {
            // Put it in the union if it isn't already there. Repeats may happen
            // here.
            union[in_list[i]] = true;
            union_size++;
            
            if(layer_data[out_list[i]] === 1) {
                // Count it if it was a success as a success in the union.
                union_yes++;
            }
            
        }
        
        if(layer_data[out_list[i]] === 1) {
            // Count it if it was a success as a success in the out-group, even
            // if it's already in the union.
            outside_yes++;
        }
    }
    
    // OK now we know the sufficient statistics for the test. Run the actual
    // test.
    var p = hypergeometric_test(inside_yes, draws, union_yes, union_size);
    
    // Return our p value as "p_value", and also how many non-pseudocount
    // successes were in the in_list and the out_list.
    return {
        p_value: p,
        inside_yes: inside_yes,
        outside_yes: outside_yes
    };
    
}

function hypergeometric_test(successes, draws, available, population) {
    // Perform a hypergeometric two-tailed test and return the p value for
    // drawing successes successes (or some more extreme number on either the
    // high or low end) in draws draws without replacement, from a population of
    // size population contianing availbale successful items, under the null
    // hypothesis that the draws really did come from that population.
    

    debug('hypergeometric_test()');

    // This holds the probability of exactly what we've observed under the null
    // hypothesis.
    var observed_probability = jStat.hypgeom.pdf(successes, population,
        available, draws);
    
    if(successes/draws < available/population) {
        // The observed frequency of success is lower than expected.
        
        // First, get the CDF value for the lower tail (probability of being
        // this low or lower under the null model). 
        var lower_tail = jStat.hypgeom.cdf(successes, population, 
            available, draws);
        
        // Lower tail ends at the successes we observed.
        var lower_tail_end = successes;
            
        // Now we need the upper tail (probability of being equally improbably
        // higher than expected, or higher than that, under the null model.)
        
        // Prof. Stuart convinced me we could just swap the in-group and out-
        // group around somehow, but upon actually thinking about it it turns
        // out that that doesn't make any sense to do. We actually need to work
        // out how many successes would be equally extreme at the other end of
        // the distribution.
        
        // This holds the total probability of everything more extremely
        // successful than the extremeness of the failure we've observed.
        var upper_tail = 0;
        
        for(var upper_tail_start = draws; upper_tail_start >= successes;
            upper_tail_start--) {
            // For each extreme case coming down from the top of the
            // distribution...
            
            // Get the probability for this particular case
            var case_probability = jStat.hypgeom.pdf(upper_tail_start,
                population, available, draws);
                
            if(isNaN(case_probability)) {
                // The case can't be that probable if we get a NaN out of it.
                case_probability = 0;
            }
            
            if(case_probability > observed_probability) {
                // This case is actually less extreme than what we've observed, 
                // so our summation is complete.
                
                // Adjust the endpoint back to be inclusive.
                upper_tail_start++;
                
                break;
            } else {
                // This case is more extreme than (or equally extreme as) what
                // we've observed, so use it in the total probability of being
                // more or equally extreme on the high end.
                
                // Use the CDF here since it will probably be more accurate. But
                // invert it around because CDF gives the lower side, inclusive
                // and we want the upper side, inclusive. Passing a negative
                // count of sampled successes is OK here.
                upper_tail = 1.0 - jStat.hypgeom.cdf(upper_tail_start - 1,
                    population, available, draws);
            }
        }
        
    } else {
        // The observed frequency of success is higher than expected
        
        // Get the probability in the upper tail (i.e. that we would see this
        // many successes or more under the null model). This is just 1 - the
        // CDF here, but shifting the endpoint to account for inclusivity.
        var upper_tail = 1.0 - jStat.hypgeom.cdf(successes - 1, population, 
            available, draws);
        
        // Upper tail starts at the successes we observed.
        var upper_tail_start = successes;
            
        // Now scan and find the total probability in the lower tail.
        var lower_tail = 0;
            
        for(var lower_tail_end = 0; lower_tail_end <= successes;
            lower_tail_end++) {
            // For each extreme case coming up from the bottom of the
            // distribution...
            
            // Get the probability for this particular case
            var case_probability = jStat.hypgeom.pdf(lower_tail_end,
                population, available, draws);
            
            if(isNaN(case_probability)) {
                // The case can't be that probable if we get a NaN out of it.
                case_probability = 0;
            }
            
            if(case_probability > observed_probability) {
                // This case is actually less extreme than what we've observed, 
                // so our summation is complete.
                
                // Adjust the endpoint back to be inclusive.
                lower_tail_end--;
                
                break;
            } else {
                // This case is more extreme than (or equally extreme as) what
                // we've observed, so use it in the total probability of being
                // more or equally extreme on the low end.
                
                // Use the CDF, since it's probably more accurate than doing a
                // sum ourselves. Also I happen to know the PDF uses a CDF
                // difference internally anyway.
                lower_tail = jStat.hypgeom.cdf(lower_tail_end, population, 
                    available, draws)
            }
        }
    }
    
    // Combine the two tails
    return upper_tail + lower_tail;
    
}

function binomial_compare(layer_data, in_list, out_list, all_list) {
    // Given the data of a binary layer object (an object from signature name to
    // 0 or 1 (or undefined)), and arrays of the names of "in" and "out"
    // signatures, as well asdan array of all signature names, do a binomial
    // test for whether the in signatures differ from the out signatures. Uses a
    // number of pseudocount trials as specified in the global constant
    // BINOMIAL_PSEUDOCOUNTS Returns an object of metadata, with "p_value" set
    // to either the p value of the test (two-tailed), or NaN if the test cannot
    // be performed. all_list specifies the names of all signatures that figure
    // into the analysis at all (i.e. those which the user hasn't filtered out),
    // which we use when calculating how many of our pseudocounts should be
    // successes. Signature names appearing in all_list but with no data in
    // layer_data are not counted.
    

    debug('binomial_compare()');

    // Work out the distribution from the out list
    // How many out signatures are 1?
    var outside_yes = 0;
    // And are 0?
    var outside_no = 0;
    
    for(var i = 0; i < out_list.length; i++) {
        if(layer_data[out_list[i]] === 1) {
            // This is a yes and it's outside.
            outside_yes++;
        } else if(layer_data[out_list[i]] === 0) {
            // A no and outside
            outside_no++;
        }
    }
    
    // It's OK for all the outside hexes to be 0 now. Pseudocounts can give us a
    // p value.
    
    // Now work out our pseudocounts.
    // How many signatures in all_list are successes?
    var all_yes = 0;
    // And how many are failures (as opposed to undef)
    var all_no = 0;
    
    for(var i = 0; i < all_list.length; i++) {
        if(layer_data[all_list[i]] === 1) {
            // A yes anywhere
            all_yes++;
        } else if(layer_data[all_list[i]] === 0) {
            // A real no (not a no-data) anywhere
            all_no++;
        }
    }
    
    // It't not OK for there to be no hexes in the all set. Maybe they filtered
    // out all the ones with any data?
    if(all_yes + all_no == 0) {
        // TODO: Sure wish we had layer names here.
        print("No signatures were available with data for this layer.");
        return NaN;
    }
    
    // Calculate how many pseudo-yeses we should have.
    // Match the frequency in all signatures.
    var pseudo_yes = BINOMIAL_PSEUDOCOUNTS * (all_yes / (all_yes + all_no));
    
    // pseudo-trials is just BINOMIAL_PSEUDOCOUNTS
    
    // This holds the probability of being a 1 for the out list.
    // We want to test if the in list differs significantly from this.
    var background_probability = (outside_yes + pseudo_yes) / (outside_yes + 
        outside_no + BINOMIAL_PSEUDOCOUNTS);

    if(background_probability == 0) {
        // Can't do the binomial test in this case. Somehow there were no yeses
        // anywhere.
        return NaN;
    }
    
    // How many 1s are in the in list?
    var inside_yes = 0;
    // And how many 0s?
    var inside_no = 0;
    
    for(var i = 0; i < in_list.length; i++) {
        if(layer_data[in_list[i]] === 1) {
            // This is a yes and it's inside.
            inside_yes++;
        } else if(layer_data[in_list[i]] === 0) {
            // A no and it's inside
            inside_no++;
        }
    }

    // Return the p value for rejecting the null hypothesis that the in
    // signatures follow the background distribution.
    var p = binomial_test(inside_yes + inside_no, inside_yes,
        background_probability);
        
    if(LOG_SUSPICIOUS && (p == 0 || p == 1)) {
        // We got an odd p value. Complain about it.
        print("Got suspicious p value " + p);
        print("Was binomial test for " + inside_yes + " successes in " + 
            (inside_yes + inside_no) + " trials at probability " + 
            background_probability);
        print("Background was " + outside_yes + " out of " + (outside_yes + 
            outside_no) + " with " + pseudo_yes + " out of " + 
            BINOMIAL_PSEUDOCOUNTS + " pseudocounts.");
    }
     
    // Return our p value as "p_value", and also how many non-pseudocount
    // successes were in the in_list and the out_list.
    return {
        p_value: p,
        inside_yes: inside_yes,
        outside_yes: outside_yes
    };
}    
    
function binomial_test(trials, successes, success_probability) {

    debug('binomial_test()');

    if(trials < successes) {
        print("Trying to test " + trials + " trials with " + successes + 
            " successes!");
    }

    // Return the p value for rejecting the null hypothesis that the observed
    // number of successes happened in the observed number of trials when the
    // probability of success was success_probability. Does a Binomial
    // test.
    
    // Calculate the P value
    // This must be terribly complicated since nobody seems to have written up 
    // how to do it as anything other than an arcane stats ritual.
    // Something close: http://www.johnmyleswhite.com/notebook/2012/04/14/implem
    // enting-the-exact-binomial-test-in-julia/
    // How scipy.stats does it (x = successes, n = trials, p = supposed 
    // probability):
    // SourceForge says Scipy is BSD licensed, so we can steal this code for our
    // comments.
    /*
        d = distributions.binom.pmf(x,n,p)
        rerr = 1+1e-7
        if (x < p*n):
            i = np.arange(np.ceil(p*n),n+1)
            y = np.sum(distributions.binom.pmf(i,n,p) <= d*rerr,axis=0)
            pval = distributions.binom.cdf(x,n,p) + distributions.binom.sf(n-y,
                n,p)
        else:
            i = np.arange(np.floor(p*n))
            y = np.sum(distributions.binom.pmf(i,n,p) <= d*rerr,axis=0)
            pval = distributions.binom.cdf(y-1,n,p) + distributions.binom.sf(
                x-1,n,p)
    */
    // There is of course no justification for why this would work.
    // What it's actually doing is a complicated Numpy vectorized operation to 
    // find the boundary of the tail we don't have, and then adding the CDF of 
    // the lower tail boundary and (1-CDF) of the upper tail boundary (which is 
    // the P value by definition).
    
    // This holds the probability of exactly what we've observed under the null
    // hypothesis.
    var observed_probability = binomial_pmf(trials, successes, 
        success_probability);
    
    if(successes < trials * success_probability) {
        // We know anything with fewer successes than this is more extreme. But
        // how many successes would we need to have an equally extreme but
        // higher than expected number of successes?
        // We should sum down from all successes. (We'll sum from small to large
        // so it's OK numerically.)
        
        // This holds the total probability of everything more extremely
        // successful than what we've observed.
        var other_tail_total_probability = 0;
        
        // TODO: implement some better sort of search thing and use CDF
        for(var other_tail_start = trials; other_tail_start >= 
            Math.ceil(trials * success_probability); other_tail_start--) {
            
            // Get the probability for this particular case
            var case_probability = binomial_pmf(trials, other_tail_start, 
                success_probability);
            
            if(case_probability > observed_probability) {
                // This case is actually less extreme than what we've observed, 
                // so our summation is complete.
                
                break;
            } else {
                // This case is more extreme than what we've observed, so use it
                other_tail_total_probability += case_probability;
            }
        }
        
        // This holds the probability in this tail
        var this_tail_probability = binomial_cdf(trials, successes, 
            success_probability)
        
        
        // Return the total probability from both tails, clamped to 1.
        return Math.min(this_tail_probability + other_tail_total_probability, 
            1.0);
    } else {
        // We know anything with more successes than this is more extreme. But
        // how few successes would we need to have an equally extreme but lower
        // than expected number of successes?
        // We will sum up from 0 successes. We really ought to use the CDF 
        // somehow, but I can't think of how we would do it.
        
        // This holds the total probability of everything more extremely
        // failureful than what we've observed.
        var other_tail_total_probability = 0;
        
        for(var other_tail_end = 0; other_tail_end < 
            Math.floor(trials * success_probability); other_tail_end++) {
            // We only have to iterate up to the peak (most likely) value.
        
            // Get the probability for this particular case
            var case_probability = binomial_pmf(trials, other_tail_end, 
                success_probability);
            
            if(case_probability > observed_probability) {
                // This case is actually less extreme than what we've observed, 
                // so our summation is complete.
                break;
            } else {
                // This case is more extreme than what we've observed, so use it
                other_tail_total_probability += case_probability;
            }     
            
        }
        
        // This holds the probability in this tail. It is equal to the
        // probability up to, but not including, where this tail starts. So even
        // if the tail starts at the highest possible number of successes, it
        // has some probability. successes can't be 0 here (since then we'd be
        // below any nonzero expected probability and take the other branch.
        // Since it's a positive integer, it must be 1 or more, so we can
        // subtract 1 safely.
        var this_tail_probability = 1 - binomial_cdf(trials, successes - 1, 
            success_probability);
        
        // Return the total probability from both tails, clamped to 1
        return Math.min(this_tail_probability + other_tail_total_probability, 
            1.0);
    }
        
    
}

function binomial_cdf(trials, successes, success_probability) {
    // The Binomial distribution's cumulative distribution function. Given a 
    // number of trials, a number of successes, and a success probability, 
    // return the probability of having observed that many successes or fewer.
    
    // We compute this efficiently using the "regularized incomplete beta 
    // function", AKA the beta distribution cdf, which we get from jStat.
    // See http://en.wikipedia.org/wiki/Binomial_distribution#Cumulative_distrib
    // ution_function and http://en.wikipedia.org/wiki/Regularized_incomplete_be
    // ta_function#Incomplete_beta_function
    

    debug('binomial_cdf()');

    if(trials == successes) {
        // We would have a 0 alpha for the beta distribution (no failures)
        // Calculate this one by hand (it's easy)
        return 1;
    }
    
    if(trials < successes) {
        // This should never happen. TODO: Debug when it happens.
        print("Error: trials (" + trials + ") < successes (" + successes + 
            ")!");
        return NaN;
    }
    
    // This is the observation that we want the beta distribution CDF before
    var beta_observation = 1 - success_probability;
    
    // These are the parameters of the relavent beta distribution
    var beta_alpha = trials - successes;
    var beta_beta = successes + 1;
    
    // Return the beta distribution CDF value, which happens to also be our CDF.
    return jStat.beta.cdf(beta_observation, beta_alpha, beta_beta);
}

function binomial_pmf(trials, successes, success_probability) {
    // The Binomial distribution's probability mass function. Given a number of
    // trials, a number of successes, and the probability of success on each
    // trial, calculate the probability of observing that many successes in that
    // many trials with the given success rate.
    
    // The probability of this many successes in this many trials at this
    // success rate is the probability of succeeding so many times and failing
    // so many times, summed over all the mutually exclusive arrangements of
    // successes and failures.

    debug('binomia_pmf()');

    return (choose(trials, successes) *
        Math.pow(success_probability, successes) * 
        Math.pow(1 - success_probability, trials - successes));
    
}

function choose(available, selected) {
    // The choose function: from available distinct objects, how many ways are 
    // there to select selected of them. Returns "available choose selected". 
    // Works with large input numbers that are too big to take the factorials 
    // of.
    
    // We use a neat overflow-robust algorithm that eliminates the factorials 
    // and makes the computation a multiplication of numbers greater than one.
    // So, no overflow unless the result itself is too big.
    // See http://arantxa.ii.uam.es/~ssantini/writing/notes/s667_binomial.pdf
    

    debug('choose()');

    if(selected < available - selected) {
        // It would be faster to think about choosing what we don't include. So
        // do that instead.
        return choose(available, available - selected);
    }
    
    // This holds the result we are accumulating. Initialize to the 
    // multiplicative identity.
    var result = 1;
    
    for(var i = 1; i < available - selected + 1; i++) {
        result *= (1 + (selected / i));
    }
    
    // TODO: The result ought always to be an integer. Ensure this.
    return result;
}
/*
function pearson_correlation (a1, a2) {
	// Note: Summary taken from scipy.stats source on pearson correlation
	// The following function is a converstion of scipy code to JavaScript
	// for client side statistical analysis and attribute sorting.
    // See https://github.com/scipy/scipy/blob/v0.12.0/scipy/stats/stats.py#L2373
	// for scipy code.
	// See http://www.socscistatistics.com/tests/pearson/Default.aspx for equation.

    // Calculates a Pearson correlation coefficient and the p-value for testing
	// non-correlation.

	// The Pearson correlation coefficient measures the linear 
    // relationship between two datasets. Strictly speaking, Pearson's 
	// correlation requires that each dataset be normally distributed. 
	// Like other correlation coefficients, this one varies between -1 and +1 
	// with 0 implying no correlation. Correlations of -1 or +1 imply an 
	// exact linear relationship. Positive correlations imply that as 
	// x increases, so does y. Negative correlations imply that as x increases, 
	// y decreases.

	// The p-value roughly indicates the probability of an uncorrelated system
	// producing datasets that have a Pearson correlation at least as extreme
	// as the one computed from these datasets. The p-values are not entirely
	// reliable but are probably reasonable for datasets larger than 500 or so.

    // a1 is the list of continuous values for all samples for Attribute 1
	// a2 is the list of continuous values for all samples for Attribute 2
	
    // Set default result to null
    result = null;

	// Check to make sure that there the number of values in a1 & a2 are equal
    // If not, return null result.
    if (a1.length != a2.length) {
		return result;
	} 
    else {
		l = a1.length;
		sum_a1 = 0;
        sum_a2 = 0;
		
		// Calculate mean of values in a1 & a2 
        for (var i = 0; i < l; i++){
			sum_a1 = a1[i] + sum_a1;
			sum_a2 = a2[i] + sum_a2;
		}
		m_a1 = sum_a1/l;
		m_a2 = sum_a2/l;

		// For each index in a1 and a2 subtract the mean from the original value
        a1_minus = [];
		a2_minus = [];
		for (var i = 0; i < l; i++){
			a1_minus.push(a1[i] - m_a1);
			a2_minus.push(a2[i] - m_a2);
		}
		
		// Calculate the numerator of the pearson correlation coefficient:
		// sum of all (value_1 - average_value_1) * (value_2 - average_value_2)
		r_num = 0;
		for (var i = 0; i < l; i++){
			current_val = a1_minus[i] * a2_minus[i];
			r_num = current_val + r_num;
		}

		// Calculate the denominator of the pearson correlation coefficient:
		// (sum of all (value_1 - average_value_1)^2)^1/2 * (sum of all (value_2 - average_value_2)^2)^1/2
		sum_a1_minus = 0;
		sum_a2_minus = 0;
		for (var i = 0; i < l; i++) {
			sum_a1_minus = (a1_minus[i] * a1_minus[i]) + sum_a1_minus;
			sum_a2_minus = (a2_minus[i] * a2_minus[i]) + sum_a2_minus;
		}
		r_den = Math.sqrt(sum_a1_minus) * Math.sqrt(sum_a2_minus);
		
		result = r_num/r_den;
		return result;
	}
}
*/
//});
