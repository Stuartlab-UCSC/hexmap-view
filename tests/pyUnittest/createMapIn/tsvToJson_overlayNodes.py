#!/usr/bin/env python

# Transform a specifically-formatted tsv file into a json file

# Usage: python tsvToJson_overlayNodes.py <tsv-file> <mapID> <layout>

import sys, string, json, csv, pprint

# Read data like this:
#   id      sample1  sample2    ...
#   gene1    val11     val12    ...
#   gene2    val21     val22    ...
#   ...
#
# and transform it into this:
#{
#   "map": "pancan33+",
#   "layouts": {
#       "mRNA": {
#           "sample1": {
#               "gene1": "val11",
#               "gene2": "val12",
#           },
#           "sample2": {
#               "gene1": "val21",
#               "gene2": "val22",
#               (1 to N properties)
#               ...
#           },
#           (1 to N nodes)
#           ...
#       },
#       ...
#       (1 to N layouts)
#   },
#}

file = sys.argv[1]
map = sys.argv[2]
layout = sys.argv[3]

# Build the node data
with open(file, 'rU') as fIn:
    fIn = csv.DictReader(fIn, delimiter='\t')
    fields = fIn.fieldnames
    x = {field: {} for field in fields[1:]}
    print 'x', x
    for row in fIn:
        iList= list(enumerate(fields))
        for i, field in iList[1:]:
            x[fields[i]][row[fields[0]]] = row[field]

# Build the entire data
data = {
    'map': map,
    'layouts': {
        'mRNA': x
    },
}
#print json.dumps(data, indent=4)

with open(file + '.json', 'w') as f:
    f.write(json.dumps(data, indent=4));

print 'success with tsvToJson_overlayNodes.py'
