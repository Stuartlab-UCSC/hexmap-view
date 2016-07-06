
Generate Layout & Statistics
============================

This describes the layout utility that finds
positions for the nodes based on similarity scores and generates associative
statistics.

layout.py
---------

Here is an example script with typical parameters to generate input for the Tumor Map viewer::

 BASE_DIR=/data/hexmap/data
 INPUT_DIR=$BASE_DIR/layoutInput/QuakeBrain
 OUTPUT_DIR=$BASE_DIR/view/QuakeBrain

 python2.7 $HEXMAP/calc/layout.py \
    $INPUT_DIR/layout_sparse_mrna_data.tab \
    $INPUT_DIR/layout_sparse_methylation_data.tab \
    --names mRNA \
    --names Methylation \
    --scores $INPUT_DIR/attributes_clinical.tsv \
    --scores $INPUT_DIR/attributes_mutations.tsv \
    --include-singletons \
    --colormaps $INPUT_DIR/colormaps.tab \
    --first_attribute Tissue \
    --directory $OUTPUT_DIR

Where he first two parameters are two different sparse matrix data files.
There should be one of these for each layout.

**names**: unique ID/label for a layout
**scores**:  values for each signature
**include-singletons**: add self-edges to retain unconnected points
**colormaps**: colormap for categorical attributes
**first_attribute**: attribute by which to color the map upon first display
**directory**: layout and statistical output files

These are some lesser used parameters::

**attributeTags**: tags for filtering and searching for attributes
**min-window-nodes**: min nodes per window for layout-aware stats
**max-window-nodes**: max nodes per window for layout-aware stats
**no-density-stats**: don't calculate density stats
**no-layout-independent-stats**: don't calculate layout-independent stats
**no-layout-aware-stats**: don't calculate layout-aware stats
**truncation_edges**: edges per node for DrL and the directed graph
**windowSize**: clustering window count is this value squared
**drlpath**: DrL binaries


