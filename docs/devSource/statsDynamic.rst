Web API: Dynamic Statistics
---------------------------

https://<hub>/query/**dynamicStats**

POST with content-type: application/json

data-type: ?

This request returns data as tsv rather than as json. It was
implemented prior to standardizing on json. We should move to json so this API
can be called from anywhere and not just from the UI.

Below is just one sort of call. Need to define each parameter and its possible
values

**Request**

Example::

 {
    "request": "statsDynamic",
    layerA: focus_attr,
    layerIndex: ctx.layer_names_by_index.indexOf(focus_attr),
    statsLayers: ctx.bin_layers,
    dynamicData: {},
    directory: ctx.project,
    binLayers: ctx.bin_layers.concat(diffLayer),
    catLayers: ctx.cat_layers,
    contLayers: ctx.cont_layers,
    layout: layout_index,
    anticorrelated: anticorrelated,
    tempFile: 'yes',
 }

TBD
