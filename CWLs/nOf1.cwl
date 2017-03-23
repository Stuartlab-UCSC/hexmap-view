
cwlVersion: v1.0 

class: CommandLineTool

baseCommand: placeNode.py

hints:
  - class: DockerRequirement
    dockerPull: dmccoll/tmcalc:v1

arguments:
  ["--outputbase", ""]
  
inputs:
  - id: ClusterData 
    type: File
    inputBinding:
      position: 1
      prefix: "-i1"
    doc: .tab matrix file, the matrix used to create clustering of map 

  - id: XYpostions
    type: File
    inputBinding:
      position: 2
      prefix: "-p"
    doc: .tab separated file, the 2d place assignment for map

  - id: NewNodesData
    type: File
    inputBinding:
      position: 5
      prefix: "-i2"
    doc: .tab separated file, a matrix of new nodes to place on the map

  - id: TopNeighbors
    type: int
    inputBinding:
      position: 3
      prefix: "-t"
    doc: number of neighbors to use in new node placement

  - id: MapId
    type: string
    inputBinding:
        position: 4
        prefix: "--mapID"
    doc: the map identifier used to generate primitive URLs
   
   - id: numJobs
    type: int
    inputBinding:
      position: 5
      prefix: "--num_jobs"
    doc: number of processors to use during similairity calc

outputs:
  - id: XyOutput
    type: File
    outputBinding:
      glob: _xypositions.tab
  - id: NeighborOutput
    type: File
    outputBinding:
      glob: _neighbors.tab
  - id: UrlOutput
    type: File
    outputBinding:
      glob: _urls.list
