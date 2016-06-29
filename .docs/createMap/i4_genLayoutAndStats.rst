
Generate Layout & Statistics
============================

This describes the layout utility that finds
positions for the nodes based on similarity scores and generates associative
statistics.

layout.py
---------

Here is an example script with typical parameters to generate input for the Tumor Map viewer::

 BASE_DIR = /cirm/tumorMap/data
 INPUT_DIR = $BASE_DIR/layoutInput/project/subProject
 OUTPUT_DIR = $BASE_DIR/view/project/subProject

 python2.7 *HEX*/calc/layout.py \
    $INPUT_DIR/layout_sparse_mrna_data.tab \         # similarity sparse matrix file
    $INPUT_DIR/layout_sparse_methylation_data.tab \  # similarity sparse matrix file
    --names mRNA \                                   # unique ID/label for a layout
    --names Methylation \                            # unique ID/label for a layout
    --scores $INPUT_DIR/attributes_clinical.tsv \    # values for each signature
    --scores $INPUT_DIR/attributes_mutations.tsv \   # values for each signature
    --include-singletons \                           # add self-edges to retain unconnected points
    --colormaps $INPUT_DIR/colormaps.tab \           # colormap for categorical attributes
    --first_attribute Tissue \                       # attribute by which to color the map upon first display
    --directory $OUTPUT_DIR \                        # layout and statistical output files

The first two parameters are two different sparse matrix data files.
There should be one of these for each layout.

*names* are the labels that will show up on the UI for the two
layouts above.

*scores* are the attribute files and there may be more than one of these.

These are some lesser used parameters::

    --attributeTags                # tags for filtering and searching for attributes
    --min-window-nodes             # min nodes per window for layout-aware stats
    --max-window-nodes             # max nodes per window for layout-aware stats
    --no-density-stats             # don't calculate density stats
    --no-layout-independent-stats  # don't calculate layout-independent stats
    --no-layout-aware-stats        # don't calculate layout-aware stats
    --truncation_edges             # edges per node for DrL and the directed graph
    --windowSize                   # clustering window count is this value squared
    --drlpath                      # DrL binaries


