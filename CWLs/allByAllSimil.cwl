
cwlVersion: v1.0 

class: CommandLineTool

baseCommand: compute_sparse_matrix.py

hints:
  - class: DockerRequirement
    dockerPull: dmccoll/tmcalc:latest

arguments:
  ["--output_type", "full",
   "--out_file","allByAllSim.tab",
   "--metric","spearman","--log", "logger",
   "--num_jobs", "8"]
  
inputs:
  - id: ClusterData 
    type: File
    inputBinding:
      position: 1
      prefix: "--in_file"
    doc: .tab matrix file, all by all column similairty will be generated  

outputs: 
  - id: output
    type: File
    outputBinding:
      glob: allByAllSim.tab
