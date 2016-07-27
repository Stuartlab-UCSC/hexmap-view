#!/usr/bin/env cwl-runner

class: CommandLineTool
id: "VarFilter"
label: "VarFilter tool"
cwlVersion: cwl:draft-3
description: |
    A Docker container for the variance filter command. See https://github.com/ucscHexmap/hexagram/tree/dev/.calc/docker/variance_filter for more information.
    ```
    Usage:
    # fetch CWL
    TODO
    $> dockstore tool cwl --entry quay.io/hexmap_ucsc/hexagram_variance_filter:1.0 > Dockstore.cwl
    # make a runtime JSON template and edit it (or use the content of sample_configs.json in this git repo)
    $> dockstore tool convert cwl2json --cwl Dockstore.cwl > Dockstore.json
    # run it locally with the Dockstore CLI
    $> dockstore tool launch --entry quay.io/hexmap_ucsc/hexagram_variance_filter:1.0 \
        --json Dockstore.json
    ```

dct:creator:
  "@id": "http://orcid.org/0000-0002-6874-4335/"
  foaf:name: Yulia Newton
  foaf:mbox: "mailto:yulia.newton@gmail.com"

requirements:
  - class: DockerRequirement
    dockerPull: "quay.io/hexmap_ucsc/hexagram_variance_filter:1.0"

hints:
  - class: ResourceRequirement
    coresMin: 1
    ramMin: 4092
    outdirMin: 512000
    description: "the process requires at least 4G of RAM"

inputs:
  - id: "#in_pivot"
    type: File
    description: "json of the input pivot(s)"
    inputBinding:
      position: 1
      prefix: "--in_pivot"

  - id: "#filter_level"
    type: string
    default: "0.2"
    description: "Proportion of genes with lowest variance to filter out"
    inputBinding:
      position: 2
      prefix: "--filter_level"

outputs:
  - id: "#out_file"
    type: File
    outputBinding:
      glob: output.tsv
    description: "A tsv file that contains filtered version of the input matrix."

baseCommand: ["/opt/conda/bin/python", "/usr/local/bin/filter_out_lowest_varying_genes.py", "--out_file", "output.tsv"]
