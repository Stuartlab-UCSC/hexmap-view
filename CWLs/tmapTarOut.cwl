
cwlVersion: v1.0 

class: CommandLineTool

baseCommand: layout.py 

hints:
  - class: DockerRequirement
    dockerPull: dmccoll/tmcalc:v1

arguments:
  ["--self-connected-edges",
  "--no_layout_independent_stats",
  "--no_layout_aware_stats",
  "--metric",
  "spearman",
  "--output_tar",
  "mapFiles.tar",
  "--directory",
  ".",
  "--names",
  "layer"]
  
inputs:
  - id: ClusterData 
    type: File
    inputBinding:
      position: 1
      prefix: "--feature_space"
    doc: .tab matrix file, columns will be clustered
  - id: Colormap
    type: File
    inputBinding:
      position: 2
      prefix: "--colormaps"
    doc: .tab separated colormaps file, see tumormap docs for format
  - id: MetaData 
    type: File
    inputBinding:
      position: 3
      prefix: "--scores"

    doc: .tab separated matrix, samples x attributes 

outputs:
  - id: output
    type: File
    outputBinding:
      glob: mapFiles.tar
