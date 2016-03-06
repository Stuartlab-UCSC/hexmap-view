#!/usr/bin/env python

# Usage: python tsvToJson.py < refGene.tsv > refGene.json

import sys
import string
import json

titles = [string.strip(t) for t in string.split(sys.stdin.readline(), sep="\t")]
for l in sys.stdin:
    d = {}
    for t, f in zip(titles, string.split(l, sep="\t")):
        d[t] = string.strip(f)
    print json.dumps(d, indent=4)
    print ','

