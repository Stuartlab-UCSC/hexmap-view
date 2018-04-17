/**
 * Retrieve data.
 */

import ajax from '/imports/mapPage/data/ajax';
import Colormap from '/imports/mapPage/color/Colormap';
import perform from '/imports/common/perform';
import rx from '/imports/common/rx';
import util from '/imports/common/util';

function request (id, opts) {

    // Retrieve a data file via ajax.
    // @param id: the identifier for this data (file)
    // @param successFx: function to call on success
    // @param rxAction; optional state action to take on success
    // @param stateVar; optional state variable to set to true on success
    perform.log(id + '.tab_requested');
    if (_.isUndefined(opts)) {
        opts = {};
    }
    var aOpts = {
        id: id,
        success: function (results) {
            perform.log(id + '.tab_got');
            if (opts.successFx) {
                opts.successFx(results, id);
            }
            if (opts.rxAction) {
                rx.set(opts.rxAction);
            } else if (opts.stateVar) {
                Session.set(opts.stateVar, true);
            }
        },
        error: function (error) {
            if (opts.errorFx) {
                opts.errorFx(error);
            } else {
                util.mapNotFoundNotify(('(' + id + ')'));
            }
        },
    };
    if (opts.ok404) {
        aOpts.ok404 = true;
    }
    ajax.get(aOpts);
}

exports.requestStats = function (id, opts) {
    opts.ok404 = true;
    request(id, opts);
};

exports.requestMapMeta = function (opts) {

    // Request the metadata within the map minor data.
    import overlayNodes from '/imports/mapPage/calc/overlayNodes.js';
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || overlayNodes.receiveMapMetadata;
    opts.errorFx = opts.errorFx || overlayNodes.requestMapMetadataError;
    request('mapMeta', opts);
};

exports.requestAttributeTags = function (opts) {
    import filter from '/imports/mapPage/longlist/filter.js';
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || filter.receiveLayerTags;
    opts.errorFx = opts.errorFx || filter.requestLayerTagsError;
    request('attribute_tags', opts);
};

exports.requestLayoutNames = function (opts) {
    import layout from '/imports/mapPage/head/layout.js';

    // This may have been requested already if a layout name was supplied,
    // but no layout index.
    if (rx.get('init.layoutNamesRequested')) {
        return;
    }
    rx.set('init.layoutNamesRequested');
    opts.successFx = opts.successFx || layout.layoutNamesReceived;
    opts.ok404 = true;
    request('layouts', opts);
};

exports.requestColormaps = function (opts) {
    opts.successFx = opts.successFx || Colormap.received;
    request('colormaps', opts);
};

exports.requestLayer = function (id, opts) {
    request(id, opts);
};

exports.requestDataTypes = function (opts) {
    import longlist from '/imports/mapPage/longlist/longlist.js';
    opts.successFx = opts.successFx || longlist.layerTypesReceived;
    request('Layer_Data_Types', opts);
};

exports.requestLayerSummary = function (opts) {
    import longlist from '/imports/mapPage/longlist/longlist.js';
    if (!opts) {
        opts = {};
    }
    opts.successFx = opts.successFx || longlist.layerSummaryLoaded;
    request('layers', opts);
};

exports.requestLayoutAssignments = function (opts) {
    import hexagons from '/imports/mapPage/viewport/hexagons.js';
    var index = Session.get('layoutIndex');
    
    // If no layout index was supplied ...
    if (_.isUndefined(index)) {
    
        // If a layout name was supplied (in the url) ...
        if (Session.get('layoutName')) {
        
            // A layout name was supplied, so we need to get the layout list
            // before we know the layout index to download layout node placement
            exports.requestLayoutNames(
                { rxAction: 'init.layoutNamesReceived' });
            return;
        } else {
            // Default to the first layout.
            index = 0;
            Session.set('layoutIndex', 0);
        }
    }
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.successFx = opts.successFx || hexagons.layoutAssignmentsReceived;
    request((Session.get('mapView') === 'honeycomb' ? 'assignments' :
        'xyPreSquiggle_') + index, opts);
};
