// util.js
// This contains various utilities used throughout the code.

import dnt from '/imports/lib/dnt';
import rx from '/imports/common/rx';
import select2 from '/imports/lib/select2';
import userMsg from '/imports/common/userMsg';

exports.get_username = function (callback) {
    
    // Callback will be called with one parameter: the username or undefined
    Meteor.call('get_username', function (error, results) {
        if (error || !results) {
            callback(undefined);
        } else {
            callback(results);
        }
    });
}

exports.isValidFileName = function (name) {
    var index = name.search(/[^A-Za-z0-9_\-\.]/g);
    return (index < 0);
}

exports.clean_file_name = function (dirty) {
    
    // Make a directory or file name out of some string
    // Valid characters:
    //     a-z, A-Z, 0-9, dash (-), dot (.), underscore (_)
    // All other characters are replaced with underscores.
    
    if (!dirty) { return undefined; }
    
    return dirty.replace(/[^A-Za-z0-9_\-\.]/g, "_");
}

exports.getDataType = function (layerName) {
    let dataType = layers[layerName.dataType];
    if (dataType === undefined) {
        if (exports.is_binary(layerName)){
            dataType = "binary"
        } else if (exports.is_continuous(layerName)){
            dataType = "continuous"
        } else if (exports.is_categorical(layerName)){
            dataType = "categorical"
        } else {
            throw 'No dataType for attribute: ' + layerName;
        }
    }
    return dataType;
}

exports.is_continuous = function (layer_name) {
    return (ctx.cont_layers.indexOf(layer_name.toString()) > -1);
}

exports.is_categorical = function (layer_name) {
        var is_cat;
        if ( _.isUndefined(layer_name) ){
            is_cat = false
        } else {
            is_cat = (ctx.cat_layers.indexOf(layer_name.toString()) > -1)
}
        return is_cat;
    }

exports.is_cat_or_bin = function (layer_name){
        return (exports.is_categorical(layer_name) ||
            exports.is_binary(layer_name));
    }

exports.is_binary = function (layer_name) {
        var is_bin;
        if ( _.isUndefined(layer_name) ){
            is_bin = false
        } else {
            is_bin = (ctx.bin_layers.indexOf(layer_name.toString()) > -1)
}
        return is_bin;
    }

exports.round = function (x, n) {
    if (!n) {
        n = 0;
    }
    var m = Math.pow(10, n);
    return Math.round(x * m) / m;
}

exports.getHumanProject = function (project) {

    // Transform a project from dir structure to display for humans
    return project.slice(0, -1);
}

export function hideAllSnakes () {
    rx.set('snake.map.hide');
    rx.set('snake.shortlist.hide');
}

exports.mapNotFoundNotify = function (more, stackTrace) {
    if (!ctx.mapNotFoundNotified) {
        ctx.mapNotFoundNotified = true;

        var name = exports.getHumanProject(ctx.project),
            msg = 'Map "' + name + '" not found.\nPlease select another';
        if (Meteor.user() === null) {
            msg += ' or sign in'
        }
        msg += '. ' + more;
        userMsg.error(msg, {logStr: stackTrace});
        hideAllSnakes();
    }
}

exports.parseTsv = function (data) {

    if (data.length < 1) {
        return [];
    }

    // Separate the data into an array of rows
    var rows = data.split('\n'),

    // Separate each row into an array of values
    parsed = _.map(rows, function(row) {
        return row.split('\t');
    });
    
    // Remove any empty row left from the new-line split
    if (parsed[parsed.length-1].length === 1 &&
            parsed[parsed.length-1][0] === '') {
        parsed.pop();
    }
    return parsed;
}

exports.removeFromDataTypeList = function (layer_name) {

    // Remove this layer from the appropriate data type list
    var index = ctx.bin_layers.indexOf(layer_name);
    if (index > -1) {
        ctx.bin_layers.splice(index, 1);
    } else {
        index = ctx.cat_layers.indexOf(layer_name);
        if (index > -1) {
            ctx.cat_layers.splice(index, 1);
        } else {
            index = ctx.cont_layers.indexOf(layer_name);
            if (index > -1) {
                ctx.cont_layers.splice(index, 1);
            }
        }
    }
}

function setHeightSelect2 ($el) {

    // Make the bottom of the list no longer than the main window
    $el.parent().on('select2-open', function () {
        var results = $('#select2-drop .select2-results');
        results.css(
            'max-height', $(window).height() - results.offset().top - 15);
    });
}

exports.createOurSelect2 = function ($el, optsIn, defaultSelection) {

    // Create a select2 drop-down.

    // Including our favorite options
    var opts = {
        dropdownAutoWidth: true,
        minimumResultsForSearch: -1,
    };

    // The caller's options override our favorite options
    for (var key in optsIn) {
        if (optsIn.hasOwnProperty(key)) {
            opts[key] = optsIn[key];
        }
    }

    // Create the select2 object
    $el.select2(opts);

    // Set the default selection
    if (defaultSelection) {
        $el.select2('val', defaultSelection);
    }

    setHeightSelect2($el);
}

exports.addToDataTypeList = function (layer_name, dataType) {
    if (dataType === 'binary') {
        ctx.bin_layers.push(layer_name);
    } else if (dataType === 'categorical') {
        ctx.cat_layers.push(layer_name);
    } else {
        ctx.cont_layers.push(layer_name);
    }
}

exports.googleAnalytics = function () {

    // Before including google analytics, respect the user's wish not to be
    // tracked if she set this in her browser preferences.
    if (!dnt._dntEnabled()) {
        /* eslint-disable */
        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
        ga('create', 'UA-76132249-2', 'auto');
        ga('send', 'pageview');
        /* eslint-enable */
    }
}


