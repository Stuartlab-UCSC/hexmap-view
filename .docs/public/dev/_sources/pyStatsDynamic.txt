
Python API: statsDynamic
========================

Request the dynamic calculation of statistics for a dynamically-generated
attribute, or because stats were not precomputed.

See :doc:`pythonApi` for general information about python APIs as well as an
example call and response.

The data within the temporary files are explained here.

Note that this request returns data as tsv rather than as json. It was
implemented prior to standardizing on json.

Request
-------

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
    proxPre: Session.get('proxPre'),
    tempFile: 'yes',
 }

Definitions

TBD

Format::

 TBD

Response
--------

**Success**

TBD

**Errors**

Response errors are at :doc:`pythonApi`

