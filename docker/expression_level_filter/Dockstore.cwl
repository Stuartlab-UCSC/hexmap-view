#!/usr/bin/env cwl-runner

class: CommandLineTool
id: "ExpressionFilter"
label: "ExpressionFilter tool"
cwlVersion: cwl:draft-3
description: |
    A Docker container for the variance filter command. See https://github.com/ucscHexmap/hexagram/tree/dev/.docker/expression_level_filter for more information.
    ```
    Usage:
    # fetch CWL
    TODO
    $> dockstore tool cwl --entry quay.io/briandoconnor/dockstore-tool-bamstats:1.25-3 > Dockstore.cwl
    # make a runtime JSON template and edit it (or use the content of sample_configs.json in this git repo)
    $> dockstore convert cwl2json --cwl Dockstore.cwl > Dockstore.json
    # run it locally with the Dockstore CLI
    $> dockstore tool launch --entry quay.io/briandoconnor/dockstore-tool-bamstats:1.25-3 \
        --json Dockstore.json
        
        Look at:
        common-workflow-language
    ```

dct:creator:
  "@id": "http://orcid.org/0000-0002-6874-4335/"
  foaf:name: Yulia Newton
  foaf:mbox: "mailto:yulia.newton@gmail.com"

requirements:
  - class: DockerRequirement
    dockerPull: "quay.io/hexmap_ucsc/hexagram_expression_level_filter:1.0"

hints:
  - class: ResourceRequirement
    coresMin: 1
    ramMin: 4092
    outdirMin: 512000
    description: "the process requires at least 4G of RAM"

inputs:
  - id: "#in_file"
    type: File
    description: "input file in matrix format (genomic matrix)"
    inputBinding:
      position: 1
      prefix: "--in_file"

  - id: "#proportion_unexpressed"
    type: string
    default: ".8"
    description: "Proportion of samples to allow to have zero expression in a given gene"
    inputBinding:
      position: 2
      prefix: "--proportion_unexpressed"

outputs:
  - id: "#out_file"
    type: File
    outputBinding:
      glob: output.tsv
    description: "A tsv file that contains filtered version of the input matrix."

baseCommand: ["python", "/usr/local/bin/filter_out_genes_unexpressed_in_most_samples.py", "--out_file", "output.tsv"]
