
Python API: statsDynamic
-------------------------

Request the dynamic calculation of statistics due to a dynamically-generated
attribute, or because stats were not precomputed.

Note that this request returns data as tsv rather than as json;
implemented prior to standardizing on json.

pre-json options example::

 {
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

    proxPre: Session.get('proxPre'),
    tempFile: 'yes',

Definitions
 TBD
 layout: type of values by which the new node will be placed on the map. e.g., "mRNA"

Response success example: TBD

Response success format: TBD

Response errors: TBD




