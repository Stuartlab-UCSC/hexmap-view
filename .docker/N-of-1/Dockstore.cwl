#!/usr/bin/env cwl-runner

class: CommandLineTool
id: "N-of-1 tool"
label: "N-of-1 tool"
cwlVersion: cwl:draft-3
description: |
    A Docker container for the N-of-1 tool. See https://github.com/ucscHexmap/hexagram/tree/dev/.calc/docker/N-of-1 for more information.
    ```
    Usage:
    # fetch CWL
    TODO
    $> dockstore tool cwl --entry quay.io/hexmap_ucsc/n_of_1:1.0 > Dockstore.cwl
    # make a runtime JSON template and edit it (or use the content of sample_configs.json in this git repo)
    $> dockstore tool convert cwl2json --cwl Dockstore.cwl > Dockstore.json
    # run it locally with the Dockstore CLI
    $> dockstore tool launch --entry quay.io/hexmap_ucsc/n_of_1:1.0 --json Dockstore.json
    ```

dct:creator:
  "@id": "http://orcid.org/0000-0002-6874-4335/"
  foaf:name: Yulia Newton
  foaf:mbox: "mailto:yulia.newton@gmail.com"

requirements:
  - class: DockerRequirement
    dockerPull: "quay.io/hexmap_ucsc/n_of_1:1.0"

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

  - id: "#in_background"
    type: File
    description: "background matrix"
    inputBinding:
      position: 2
      prefix: "--in_background"

  - id: "#in_coordinates"
    type: File
    description: "coordinates of the nodes in the background matrix"
    inputBinding:
      position: 3
      prefix: "--in_coordinates"

  - id: "#metric"
    type: string
    default: "correlation"
    description: "Metric for comparing pivot to background"
    inputBinding:
      position: 4
      prefix: "--metric"
      
  - id: "#num_jobs"
    type: string
    default: "-1"
    description: "Number of processors to use"
    inputBinding:
      position: 5
      prefix: "--num_jobs"
      
  - id: "#neighborhood_size"
    type: string
    default: "6"
    description: "Size of the neighborhood"
    inputBinding:
      position: 6
      prefix: "--neighborhood_size"

outputs:
  - id: "#out_file"
    type: File
    outputBinding:
      glob: output.json
    description: "A json file that contains positioning information about the pivot."

  - id: "#log"
    type: File
    outputBinding:
      glob: log.tab
    description: "Log file that has some details about the run."


baseCommand: ["/opt/conda/bin/python", "/usr/local/bin/compute_pivot_vs_background2.py", "--out_file", "output.json", "--log", "log.tab"]
