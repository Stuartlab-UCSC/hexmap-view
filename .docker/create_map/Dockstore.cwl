#!/usr/bin/env cwl-runner

class: CommandLineTool
id: "CreateMap tool"
label: "CreateMap tool"
cwlVersion: cwl:draft-3
description: |
    A Docker container for the create map tool. See https://github.com/ucscHexmap/hexagram/tree/dev/.calc/docker/create_map for more information.
    ```
    Usage:
    # fetch CWL
    TODO
    $> dockstore tool cwl --entry quay.io/hexmap_ucsc/hexagram_create_map:1.0 > Dockstore.cwl
    # make a runtime JSON template and edit it (or use the content of sample_configs.json in this git repo)
    $> dockstore tool convert cwl2json --cwl Dockstore.cwl > Dockstore.json
    # run it locally with the Dockstore CLI
    $> dockstore tool launch --entry quay.io/hexmap_ucsc/hexagram_create_map:1.0 --json Dockstore.json
    ```

dct:creator:
  "@id": "http://orcid.org/0000-0002-6874-4335/"
  foaf:name: Yulia Newton
  foaf:mbox: "mailto:yulia.newton@gmail.com"

requirements:
  - class: DockerRequirement
    dockerPull: "quay.io/hexmap_ucsc/create_map:1.0"

hints:
  - class: ResourceRequirement
    coresMin: 1
    ramMin: 4092
    outdirMin: 512000
    description: "the process requires at least 4G of RAM"

inputs:
  - id: "#similarity"
    type: File
    description: "sparse similarity"
    inputBinding:
      position: 1
      prefix: "--similarity"

  - id: "#names"
    type: string
    description: "Layout names corresponding to the similarity matrices (more than one allowed)"
    inputBinding:
      position: 2
      prefix: "--names"

  - id: "#scores"
    type: File
    description: "Attributes and annotations file(s)"
    inputBinding:
      position: 3
      prefix: "--scores"

  - id: "#truncation_edges"
    type: string
    default: "6"
    description: "Number of truncation edges"
    inputBinding:
      position: 4
      prefix: "--truncation_edges"

  - id: "#layout_method"
    type: string
    default: "DrL"
    description: "Layout method"
    inputBinding:
      position: 5
      prefix: "--layout_method"

  - id: "#directory"
    type: string
    default: "/usr/local/map/"
    description: "output directory for the files"
    inputBinding:
      position: 6
      prefix: "--directory"

  - id: "#include-singletons"
    type: boolean
    default: true
    description: "flag to include singletons"
    inputBinding:
      position: 7
      prefix: "--include-singletons"

outputs: []

baseCommand: ["/opt/conda/bin/python", "/hexagram/.calc/layout.py", ">", "paper.log"]
