// urlParms.js
// Handle project parameters in the URL.
// Bookmarks and page-only parms are handled in state.js.

import bookmark from '/imports/common/bookmark';
import userMsg from '/imports/common/userMsg';
import { checkFetchStatus, parseFetchedJson } from '/imports/common/utils';

function getParms () {

    // Retrieve the parameters in the url
    var parms = location.search.substr(1);
    var result = {};
    var found = false;
    try {
        parms.split("&").forEach(function(part) {
            if (part !== "") {
                var item = part.split("="),
                    key = item[0],
                    val = decodeURIComponent(item[1]);

                // Do we already have a value for this key?
                if (key in result) {

                    // There is a value for this key already.

                    if (typeof result[key] !== 'object') {

                        // The previous value for this key is a single value
                        // so turn the string into an array of one.
                        result[key] = [result[key]];
                    }
                    // Add to the array.
                    result[key].push(val);

                } else {
                    // A brand new key, so a simple value
                    result[key] = val;
                }
                found = true;
            }
        });
        if (found) {
            return result;
        } else {
            return null;
        }
    } catch (e) {
        
        let msg = 'The URL is malformed';
        if (e) {
            msg += ': ' + e;
        }
        userMsg.error(msg);
        return null;
    }
}

function loadWithProject (parms, stateLoadFx) {

    // Fill the store from parameters in the url when a project is included.
    var store = {
        project: projNameBackwardCompatability(parms.p),
        page: 'mapPage',
    };

    setLayout(parms, store);

    // Load any overlay nodes in the URL
    loadOverlayNodes(parms, store);

    // Find and request attrs.
    let fetching = loadAttrRequest(parms, store, stateLoadFx);
    if (!fetching) {
        stateLoadFx(store);
    }
}

function loadOverlayNodes (parms, store) {

    // Find any overlay nodes in the URL
    if (parms.x && parms.y) {

        // Split the comma-separated values into arrays
        var xs = parms.x.split(","),
            ys = parms.y.split(","),
            // TODO: this won't work if there is a comma in a node name!
            nodes = (!parms.node) ? [] : parms.node.split(",");

        store.overlayNodes = {};
        _.each(xs, function (x, i) {

            // If there is a y-value for this x-value...
            if (ys.length > i) {

                // If there is no node name, use the index as the name.
                if (nodes.length <= i) {
                    nodes[i] = i.toString();
                }
                store.overlayNodes[nodes[i]] = {x: xs[i], y: ys[i]};
            }
        });
    }
}

function loadAttrRequest(parms, store, stateLoadFx) {

    // Find any attribute requests.
    // @param parms the url parameters
    //
    // For example of continuous from xena.
    // http://localhost:3333/?
    //      xena=addAttr&
    //      p=PancanAtlas/SampleMap&
    //      layout=RPPA&
    //      hub=https://pancanatlas.xenahubs.net/data/&
    //      dataset=TCGA_pancancer_10852whitelistsamples_68ImmuneSigs.xena&
    //      attr=B_cell_PCA_16704732
    //
    // A categorical attribute from xena:
    // http://localhost:3333/?xena=addAttr&p=PancanAtlas/SampleMap&layout=mRNA&hub=https://tcga.xenahubs.net/data/&dataset=TCGA.PANCAN.sampleMap/PANCAN_clinicalMatrix&attr=sample_type&cat=Primary%20Tumor&color=1f77b4&cat=Primary%20solid%20Tumor&color=aec7e8&cat=Primary%20Blood%20Derived%20Cancer%20-%20Peripheral%20Blood&color=2ca02c&cat=Primary%20Blood%20Derived%20Cancer%20-%20Bone%20Marrow&color=98df8a&cat=Recurrent%20Tumor&color=d62728&cat=Recurrent%20Solid%20Tumor&color=ff9896&cat=Recurrent%20Blood%20Derived%20Cancer%20-%20Peripheral%20Blood&color=ff7f0e&cat=Recurrent%20Blood%20Derived%20Cancer%20-%20Bone%20Marrow&color=ffbb78&cat=Additional%20-%20New%20Primary&color=9467bd&cat=Metastatic&color=c5b0d5&cat=Additional%20Metastatic&color=8c564b&cat=Human%20Tumor%20Original%20Cells&color=c49c94&cat=Blood%20Derived%20Normal&color=e377c2&cat=Solid%20Tissue%20Normal&color=f7b6d2&cat=Buccal%20Cell%20Normal&color=bcbd22&cat=EBV%20Immortalized%20Normal&color=dbdb8d&cat=Bone%20Marrow%20Normal&color=17becf&cat=Cell%20Lines&color=9edae5&cat=Primary%20Xenograft%20Tissue&color=434348&cat=Cell%20Line%20Derived%20Xenograft%20Tissue&color=c7c7c7&cat=Control%20Analyte&color=1f77b4

    // Example of call to Xena for an attribute:
    // wget -O foo -v --header='content-type:text/plain'
    //      --post-data='(xena-query {:select
    //      ["sampleID" "B_cell_PCA_16704732"] :from
    //      ["TCGA_pancancer_10852whitelistsamples_68ImmuneSigs.xena"]})'
    //      https://pancanatlas.xenahubs.net/data/

    // Specify where the server data is requested from.
    const getXenaData =  (parms.xena === "addAttr" ),
        getComputeData = (parms.compute === "addAttr");

    // Get out of here if an attribute has not been requested.
    if (!(getComputeData || getXenaData)) { return; }

    const url = parms.hub ? parms.hub : parms.url;
    const dataset = parms.dataset;
    const attrName = parms.attr;
    const cats = parms.cat;
    const colors = parms.color;

    const receiveAttr = (data) => {
        return (processAttr(data, cats, colors, store));
    };
    const receiveError = (error) => {
        stateLoadFx(store);
        return fetchError(error);
    };
    // Structure the fetch call depending on what server the
    // data request is going to.
    let fetchInit = {};
    if (getXenaData) {
        fetchInit = {
            method: "POST",
            headers: new Headers({"Content-Type": "text/plain"}),
            body: xenaQueryStr(attrName, dataset)
        };
    }

    fetch(url, fetchInit)
        .then(checkFetchStatus)
        .then(parseFetchedJson)
        .then(receiveAttr)
        .then(stateLoadFx)
        .catch(receiveError);
        
    // Let the caller know we retrieved data.
    return true;
}

function xenaQueryStr(attrName, dataset) {
    // Build the xena query string.
    const qstr = '(xena-query {:select ["sampleID" "' +
        attrName +
        '"] :from ["' +
        dataset +
        '"]})';
    return qstr;
}

function processAttr(result, cats, colors, store) {
    const attrName =  getAttrName(result);
    const parsedData = parseData(attrName, result);
    let newLayer = buildLayer(parsedData, attrName);

    const hasCats = !(_.isUndefined(cats) || _.isUndefined(colors));
    if (hasCats) {
        newLayer[attrName] = addColorMap(
            newLayer[attrName],
            cats,
            colors
        );
    }
    store.dynamic_attrs = newLayer;
    store.active_layers = [attrName];
    store.shortlist = [attrName];
    return store;
}

function getAttrName(response){
    const reponseKeys = Object.keys(response);
    const attrNames = reponseKeys.filter(
        (key)=> { return key !== "sampleID"; }
    );
    return attrNames[0];
}

function fetchError(error) {
    if (error) {
        userMsg.error(error.message);
    } else {
        userMsg.error('Unknown server error');
    }
}

function parseData(attrName, dataIn) {
    // @param dataIn the data received in the form:
    //               {"_gender":["Male,"Female",... ,
    //               "sampleID":["sampleID1", "sampleID2",...]}
    // @return "layer type" parsing of data, { sampleId : value, ... }
    let data = {};
    _.each(dataIn.sampleID, function (id, i) {
        data[id] = dataIn[attrName][i];
    });
    return data;
}

function buildLayer(data, attrName) {
    const layer_values = {
        data: data,
        dynamic: true,
    };

    let layer = {};
    layer[attrName] = layer_values;
    return(layer);
}

function addColorMap(layerValues, catNames, colors) {
    // Todo: an equivelent function should be in Layer or better yet
    // short list.
    // Layer values is the object inside layer[attrName].
    layerValues.colormap = {
        cats: catNames,
        colors: addPoundPrefix(colors)
    };
    return layerValues;
}

function addPoundPrefix(strs) {
    return strs.map((str) =>{ return "#".concat(str); });
}

function projNameBackwardCompatability(project) {
    // Backward compatibility transformation for project names.
    var xlate = {
        'evanPaull/pCHIPS': 'pCHIPS',
        'ynewton/gliomas-paper': 'Gliomas',
        'ynewton.gliomas-paper': 'Gliomas',
        'Pancan12.GeneMap': 'Pancan12/GeneMap',
        'Pancan12.SampleMap': 'Pancan12/SampleMap',
        'CKCC.v1': 'CKCC/v1',
        'CKCC.v2': 'CKCC/v2',
    };
    if (xlate[project]) {
        project = xlate[project];
    }
    return project + '/';
}

function setLayout(parms, store) {
    if (parms.layout) {
        store.layoutName = parms.layout;
    }
}

exports.handle = function (stateLoadFx) {

    // Handle any parameters in the URL.
    var uParm = getParms();
    if (uParm === null) {
        return null;
    }
    
    console.log('WARNING: loading from parameters in the URL,',
        'other state was dropped.');

    // Handle a bookmark ID parm in the URL.
    if (uParm.bookmark) {
        bookmark.load(uParm.bookmark, stateLoadFx);
        // Other parms in the url are ignored.

    // Handle other parms in the URL.
    } else {

        // Handle a map ID / project in the URL query.
        if (uParm.p) {
            loadWithProject(uParm, stateLoadFx);

        // Handle a page in the URL query.
        } else if (uParm.pg) {

            // Load from store, except use this page.
            // This allows one to pop over to the home page, and
            // then back to the map and state previously viewed.
            stateLoadFx(null, uParm.pg);
            
        } else {
            // Some unrecognized parameter.
            userMsg.error('There is some unrecognized parameter in the URL.');
            stateLoadFx();
        }
    }
    // State is/was being loaded from urlParms.
    return true;
};
