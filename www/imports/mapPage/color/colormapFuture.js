// This code is for future use and checked in to save it.


exports.colormapStateToOperating = function (stateColormap) {
    
    // Transform a layer's state colormap to an operating colormap.
    // TODO should this load defaults if needed?
    var operatingColormap = _.map(stateColormap.cats, function (cat, i) {
        var operCat = {
            name: cat,
            color: new Color(stateColormap.colors[i]),
        };
        operCat.fileColor = oper.color;
        return operCat;
    });
    return operatingColormap;
}

exports.colormapOperatingToState = function (operColormap) {

    // Transform a layer's operating colormap to a state colormap.
    // TODO should this only store non-defaults to state?
    var stateColormap = {
        cats: [],
        colors: [],
    };
    _.each(operColormap, function (cat, i) {
        stateColormap.cats.append();
        stateColormap.colors.append();
    });
    return stateColormap;
}

exports.saveReplacedColorsToState = function () {
}

