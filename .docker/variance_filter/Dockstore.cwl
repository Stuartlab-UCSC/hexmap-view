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
    $> dockstore cwl --entry quay.io/briandoconnor/dockstore-tool-bamstats:1.25-3 > Dockstore.cwl
    # make a runtime JSON template and edit it (or use the content of sample_configs.json in this git repo)
    $> dockstore convert cwl2json --cwl Dockstore.cwl > Dockstore.json
    # run it locally with the Dockstore CLI
    $> dockstore launch --entry quay.io/briandoconnor/dockstore-tool-bamstats:1.25-3 \
        --json Dockstore.json
    ```

dct:creator:
  "@id": "http://orcid.org/TODO/"
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
  - id: "#in_file"
    type: File
    description: "input file in matrix forma (genomic matrix)"
    inputBinding:
      position: 1
      prefix: "--in_file"

  - id: "#filter_level"
    type: float
    default: .2
    description: "Proportion of samples with lowest variance to filter out"
    inputBinding:
      position: 2
      prefix: "--filter_level"

outputs:
  - id: "#out_file"
    type: File
    outputBinding:
      glob: output.tsv
    description: "A tsv file that contains filtered version of the input matrix."

baseCommand: ["/bin/bash", "/usr/local/bin/filter_out_lowest_varying_genes.py", "--out_file", "output.tsv"]
