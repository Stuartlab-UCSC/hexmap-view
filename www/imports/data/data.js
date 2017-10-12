/**
 * Retrieve data.
 */

import Ajax from './ajax.js';
import Filter from '../longlist/filter.js';
import Hexagons from '../viewport/hexagons.js';
import Hexagram from '../viewport/hexagram.js';
import Longlist from '../longlist/longlist.js';
import Perform from '../common/perform.js';
import Util from '../common/util.js';

function request (id, opts) {

    // Retrieve a data file via ajax.
    // @param id: the identifier for this data (file)
    // @param successFx: function to call on success
    // @param stateVar; optional state variable to set to true on success
    Perform.log(id + '.tab_request');
    var aOpts = {
        id: id,
        success: function (results) {
            Perform.log(id + '.tab_received');
            if (opts.successFx) {
                opts.successFx(results, id);
            }
            if (opts.stateVar) {
                Session.set(opts.stateVar, true);
            }
        },
        error: function (error) {
            if (opts.errorFx) {
                opts.errorFx(error);
            } else {
                Util.projectNotFound(id);
            }
        },
    };
    if (opts.ok404) {
        aOpts.ok404 = true;
    }
    Ajax.get(aOpts);
}

exports.requestStats = function (id, opts) {
    opts.ok404 = true;
    request(id, opts);
};

exports.requestMapMeta = function (opts) {
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || Filter.receiveMapMetadata;
    opts.errorFx = opts.errorFx || Filter.requestMapMetadataError;
    request('mapMeta', opts);
};

exports.requestAttributeTags = function (opts) {
    if (_.isUndefined(opts)) {
        opts = {};
    }
    opts.ok404 = true;
    opts.successFx = opts.successFx || Filter.receiveLayerTags;
    opts.errorFx = opts.errorFx || Filter.requestLayerTagsError;
    request('attribute_tags', opts);
};

exports.requestLayoutNames = function (opts) {
    opts.successFx = opts.successFx || Hexagons.layoutNamesReceived;
    request('layouts', opts);
    //TODO: handle 'matrices.tab'
};

exports.requestColormaps = function (opts) {
    opts.successFx = opts.successFx || Hexagram.colormapsReceived;
    request('colormaps', opts);
};

exports.requestLayer = function (id, opts) {
    request(id, opts);
};

exports.requestDataTypes = function (opts) {
    opts.successFx = opts.successFx || Longlist.layerTypesReceived;
    request('Layer_Data_Types', opts);
};

exports.requestLayerSummary = function (opts) {
    opts.successFx = opts.successFx || Longlist.layerSummaryLoaded;
    request('layers', opts);
};

exports.requestLayoutAssignments = function (opts) {
    opts.successFx = opts.successFx || Hexagons.layoutAssignmentsReceived;
    request((Session.get('mapView') === 'honeycomb' ? 'assignments' :
        'xyPreSquiggle_') + Session.get('layoutIndex'), opts);
};
