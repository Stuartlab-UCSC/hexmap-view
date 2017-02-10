#! /usr/bin/env python2.7
'''
File description coming soon.
'''

import os
import pandas as pd
import sklearn.metrics.pairwise as sklp
from scipy import stats
import numpy as np
import scipy.spatial.distance as dist
from utils import sigDigs
from utils import truncateNP
from process_categoricals import getAttributes
import  math
#input/output helpers
def readLayers(layerFile):
    return pd.read_csv(layerFile,sep='\t',index_col=0,header=None)

def getLayerIndex(layerName,layers):
    filename = layers[1].loc[layerName]
    return filename[filename.index('_')+1:filename.index('.')]

def readXYs(fpath):
	'''
    reads the xy positions from file
    :param fpath: file path  to tab seperated x-y position file, 1st col should be row names
    :return: a pandas data frame with index set to node Ids and the 
    '''
	return pd.read_csv(fpath,sep='\t',index_col=0)

def trimLayerFiles(layer_files):
    '''
    :param layer_files: dict { layer_name -> layer path, ... , ... }
    :return: a similar dict with the layer paths trimmed to only by the file name
    this is needed for writing out the layers.tab file...
    '''
    for attr in layer_files.keys():
        layer_files[attr] = layer_files[attr].split('/')[-1]
    return layer_files

def writeLayersTab(attributeDF,layers,layer_files,densityArray,datatypes,options):
    '''
    :param attributeDF: the pandas data frame holding attribute values
    :param densityArray: an array of series, each of which are returned by densityOpt()
    :param layer_files: layer_files are the names of each layer
                        produced when they are written one by one to the given directory
    :return: Layers.tab is a file used to build the UI,
             the format is tab delimited: layout_name, layout_file, number we have data for, (if binary how many 1's, else NA)
             and then each density
    '''


    #have a dict of attribute names pointing to their layer_x.tab file
    layer_files = trimLayerFiles(layer_files)
    #making an empty data frame and then filling each one of the columns
    layersTab = pd.DataFrame(index=layer_files.keys())

    #second column is the name of the layer files
    layersTab[0] = pd.Series(layer_files)

    #third column is count of non-Na's
    layersTab[1] = attributeDF[layer_files.keys()].count()

    #forth column is the count of 1's if the layer is binary, Na if not
    layersTab[2] = np.repeat(np.NAN,len(layers.keys()))

    layersTab.loc[datatypes['bin'],2] = attributeDF[datatypes['bin']].sum(axis=0)

    #the rest of the columns are the density for each layout (in order)
    for it, series_ in enumerate(densityArray):
        #fill all density with NAN in case we don't have some in the density array
        layersTab[3+it] = np.repeat(np.NAN,len(layers.keys()))
        #put the density in the dataframe
        layersTab[3+it] = series_.apply(sigDigs)

    layersTab.to_csv(options.directory + '/layers.tab',sep='\t',header=None)

def writeToFileLee(fout,leeLV,simV,colNames):
    '''
    write a single lees L to file, for use with singleLeesL function
    @param fout:
    @param leeLV:
    @param simV:
    @param colNames:
    @return:
    '''
    #truncate as an attempt to be reproducible on different machines.
    # also needed to properly determine ranks are equal when vectors have -1 correlation
    # ( so the leeL values are -.xxxxxxxxx3 and .xxxxxxxxx4, and should have been determined
    # .xxxxxxxxx35 and .xxxxxxxxx35 )
    leeLV = truncateNP(leeLV,11)
    #ranks is how the UI knows the order in which to display
    ranks =  1- (stats.rankdata(np.abs(leeLV),method='average') / len(leeLV))
    outDF = pd.DataFrame({0:leeLV,1:ranks,2:simV},index=colNames)
    #apply significant digit cutoff of 7 to all the numbers in table
    outDF = outDF.apply(lambda x: x.apply(sigDigs))

    outDF.to_csv(fout,sep='\t',header=None)

def writeToDirectoryLee(dirName,leeMatrix,simMatrix,colNameList,layers,index=0):
    '''
    this function writes the computed similarities, i.e. lees L, to a directory
    if we wanted to do p-values or something else computations for corrections would
    be done here

    The way this works is that the sign of the correlation informs the positive-negative selection
    and they are ranked by closness to zero of the pvalue
    :param dirName: ends in '/'
    :param colNameList: needs to be in the same order as the leeMatrix names
    :param layers is a dataframe, read in from layers.tab
    :return: writes files in the proper format to the directory dirName

    dirName = '/home/duncan/trash/statsL'
    '''

    assert(dirName[-1] == '/')
    for i,column in enumerate(colNameList):
        #print getLayerIndex(column,layers)
        statsO = pd.DataFrame(index= colNameList)
        statsO[0] = leeMatrix[i,]
        #truncate as an attempt to be reproducible on different machines.
        statsO[0] = truncateNP(statsO[0],11)

        #place holder for rank, need because of use of parallel structures simMat and leeMat
        statsO[1] = np.repeat(np.NAN,statsO.shape[0])

        statsO[2] = simMatrix[i,]

        statsO = statsO.iloc[statsO.index!=column] #get rid of identity

        # second column is how the UI ranks, it uses that column and the sign of leesL
        # to determine order
        statsO[1] = 1- (stats.rankdata(np.abs(statsO[0]),method='average') / (statsO.shape[0]))

        filename = 'statsL_'+ getLayerIndex(column,layers)+ '_' + str(index) + '.tab'

        statsO = statsO.apply(lambda x: x.apply(sigDigs))
        statsO.to_csv(dirName+filename,sep='\t',header=None)

def read_matrices(projectDir):
    '''
    Puts the metadata matrices files in a list, to be used in layout.getAttributes()
     and is dependent upon the matrix file being in proper format.
    @param projectDir: the project directory
    @return: a list of the matrix file names
    '''
    matlist = []
    #grab each name
    for line in open(projectDir + '/matrices.tab'):
        matlist.append(projectDir + '/' + line.strip())

    return matlist

def read_data_types(projectDir):
    '''

    @param projectDir:
    @return:
    '''
    #mapping from what is in the file to abbreviations used in dataTypeDict
    dtypemap = {"Continuous":"cont","Binary":"bin","Categorical":"cat"}
    dtfin = open(projectDir + '/Layer_Data_Types.tab')
    dataTypeDict = {}
    for line in dtfin:
        line = line.strip().split('\t')
        #if we recognize the category
        if line[0] in dtypemap:
            try:
                dataTypeDict[dtypemap[line[0]]] = line[1:]
            except IndexError:
                dataTypeDict[dtypemap[line[0]]] = []

    return dataTypeDict
#

#Math helpers
def ztransDF(df):
    '''
    :param df: pandas structure, series or data frame
    :return: z-score normalized version of df.
    '''
    return ((df - df.mean()) / df.std())

def inverseEucDistance(xys):

    distmat = dist.squareform(dist.pdist(xys,'euclidean'))
    return 1 / (1 + distmat)

def spatialWieghtMatrix(xys,nearest=False,n=None):
    '''
    :param xys: x-y positions for nodes on the map
    :return: used to generate the spatial weight matrix
    '''
    if nearest:
        invDist =XmedianNearestEucDistance(xys,n)
    else:
        invDist = inverseEucDistance(xys)

    #fill self compairsons to 0 so we can replace by the maxium closness for all nodes,
    np.fill_diagonal(invDist,0)
    notZd = pd.DataFrame(invDist,index=xys.index,columns=xys.index)

    #set the diagonal, or self comparison equal to the maxium value, so we don't inflate too much
    #notZd.values[[np.arange(notZd.shape[1])]*2] = notZd.apply(np.max,axis=1)

    return (notZd/notZd.sum(axis=1))

def attrPreProcessing4Lee(attrDF,xys):
    '''
    preproccesssing pipeline for doing leesL bivariate association
    @param attrDF:  metadata matrix, rows sample names
    @param xys:     the xy positions in the type provided by readXYs
    @return:        a new attributeDF with the preprocessing run
    '''
    #first subset the attribute matrix down to samples/nodes that are on the map
    attrOnMap = attrDF.loc[xys.index]

    #we treat missing data by first z scoring, then setting NA's to 0, order here matters
    attrOnMap = ztransDF(attrOnMap)
    attrOnMap.fillna(0,inplace=True)
    return attrOnMap
#

#main utility
def leesL(spW,Ztrans_attrDF):
    '''
    Excessive detail: https://www.researchgate.net/publication/220449126
    :param spW: spatial weight matrix
    :param Ztrans_attrDF: any z-scored attribute matrix organized with nodes as rows and attributes as columns
    :return: a leesL matrix, where the off diagonal elements are the bivariate lees L and the on diagonal are the
             spatial smoothing scalar
    '''
    return (np.dot(np.dot(Ztrans_attrDF.transpose(),np.dot(spW.transpose(),spW)),Ztrans_attrDF)) / np.dot(spW.transpose(),spW).sum().sum()

def singleLeesL(spW,ztrans_attr,ztrans_attrDF):
    '''
    spW and attributes should already have matching indecies
    Excessive detail: https://www.researchgate.net/publication/220449126
    @param spw: spatial weight matrix
    @param ztrans_attr: z transformaed attribute vector (single attribute)
    @param ztrans_attrDF: z transformaed attribute dataframe (reference attributes)
    @return: returns a vector of the the length of columns in ztrans_attrDF
             giving the leesL association of the vector with each of the columns
    '''
    return (np.dot(np.dot(ztrans_attr.transpose(),np.dot(spW.transpose(),spW)),ztrans_attrDF)) / np.dot(spW.transpose(),spW).sum().sum()

def densityOpt(allAtts,datatypes,xys,debug=False):
    '''
    An optimized version of Density calculation.
     An attribute's density is only based on the values it has data for, so A new spatial weight matrix is calculated
     for every attribute based on the nodes that it has missing values for.
     Because attributes often come in groups, and the profile of missing values is dependent on those groups, instead
     of calculating a spatial weight matrix for each attribute we can calculate one for each missing data profile.
     This is done by creating an all by all distance matrix of the missing value profiles, and using it to determine
     what attributes have the same profile, i.e. a distance of 0.

    :param allAtts: the entire attribute matrix (pandas dataframe) , density calculated for each column
    :param datatypes: a datatype dict, {'bin': [],'cont':[],'cat': []}
    :param xys: a x-y (column) by nodeId position matrix (pandas dataframe)
    :param debug: if true this function spits a bunch of chatter
    :return: a pandas Series of attributes paired with their density values.
    '''

    #parallel arrays to be stuffed with density values for each attribute
    attrNames = []
    densities = []

    #subset the attributes to the xy positions for this map.
    allAtts = allAtts.loc[xys.index]

    # constants used to determine whether there is enough data to calculate density
    minNeeded = 5
    perNeeded = .025 #percent needed
    minNodes = math.ceil(len(xys.index) * perNeeded) + minNeeded
    #
    #deal with each datatype individually
    for type_ in datatypes.keys():
        #types continuos and binary get dealt with the same
        if type_ != 'cat':
            #subset of the attributes to their type
            subAtts = allAtts[datatypes[type_]]

            #group by NaN profile. An attribute X attribute matrix
            distMat = sklp.pairwise_distances(subAtts.isnull().transpose(),metric='hamming',n_jobs=8)
            #we will be going through the distance matrix and find groups
            # of attributes with the same NaN profile (distance == 0 )

            #this keeps track of the attributes that haven't been processed
            indecies_to_check = range(len(datatypes[type_]))
            #While there are still attributes left to calculate density for...
            while(len(indecies_to_check)):
                #grab that index
                index_ = indecies_to_check[0]
                #grab the NA distances from that index to all other indecies
                sims = distMat[index_,]
                #find where the distance to them is 0
                mask = (sims == 0)

                #put the attribute names that are exactly similar into the returning structure
                attrNames.extend(subAtts.columns[mask])
                #get rid of the Na's in those attributes
                datMat = subAtts[subAtts.columns[mask]].dropna()
                datMat = ztransDF(datMat)
                #fill in the return structure with the lee SSS's

                #case out whether the map has enough data
                if datMat.shape[0] < minNodes: #the doesn't have enough nodes with data
                    densities.extend(np.repeat(np.NAN,mask.sum()))
                    print 'attributes ' + str(subAtts.columns[mask]) + ' had no values for this xy position set'
                else:
                    densities.extend(leesL(spatialWieghtMatrix(xys.loc[datMat.index]),datMat).diagonal())

                #don't check the indecies that were determined to be the same,
                # do this by removing them from the indecies that we are looking at
                for colnum in np.where(sims ==0)[0]:
                    indecies_to_check.remove(colnum)

        #deal with categoricals
        else:
            subAtts = allAtts[datatypes[type_]]

            for attr in subAtts.columns:
                #expand our categorical vector to dummy variables
                datMat = pd.get_dummies(subAtts[attr].dropna()).apply(pd.to_numeric)

                nNodes = datMat.sum().sum()
                #in case we lost any categories for the map we are looking at
                datMat = datMat[datMat.columns[datMat.sum() != 0]]
                datMat = ztransDF(datMat)

                if debug:
                    print 'categorical attribute being processed: ' + attr
                    print 'shape of dummy matrix after exclusion: ' + str(datMat.shape)
                #make sure there is enough data to calculate density
                if nNodes < minNodes:
                    print 'attribute ' + attr + ' didn\'t have enough values for this xy position set'
                    densities.append(np.NAN)
                else:
                    densities.append(catSSS(leesL(spatialWieghtMatrix(xys.loc[datMat.index]),datMat)))

                attrNames.append(attr)

    return pd.Series(densities,index=attrNames)

def catSSS(catLee):
    '''
    :param catLee: the LeesL matrix from a single categorical variable that has been expanded
                           into dummy variables, i.e. 3 categories from 1 vector being expanded to 3 binary vectors

                           The most dense categoical should have each of its categories
                             dense and also have each category well separated.

                           The diagonal of the lees L of the catLee describes the density for each
                           individual category. The off diagonal describes how much each category is
                           separated in space.

                           This metric combines on and off diagonal components by taking on_average - off_average

    :return: a function that creates a lees L estimate for a categorical variable
    '''

    #below we are twice over counting (matrix is symetric) but also twice over dividing, so that's not a mistake

    #         average of on_diagonal                           average of off diagonal
    return (catLee.trace() / catLee.shape[0]) - ((catLee.sum() - catLee.trace())/ (catLee.shape[1]**2 - catLee.shape[1]))

def dynamicCallLeesL(parm):
    '''
    making dynamic function that will call everything.
    We need to figue out how we interface with
    @param parm:
       dictionary with three keys:
          directory: "the/full/path/to/server/dir"
          layout   : int (the index of the layout in the project dir"
          layerA : layerName (str) of dynamic attr of interest
          dynamicData : {layerName -> (sample: value}, }
          tempFile : "the/output/file/path"
    @return: writes
    '''

    #make the path of the file containing x-y placements
    preSquiggleFile = os.path.join(parm['directory'], 'xyPreSquiggle_' + str(parm['layout']) +'.tab')

    #get the x-y placements for the map layout of interest
    xys = readXYs(preSquiggleFile)

    #get all the attribute data
    attrDF = getAttributes(read_matrices(parm['directory']))

    #get the datatypes from the project directory
    datatypeDict = read_data_types(parm['directory'])

    #subset down to only binary attributes.
    attrDF = attrDF[datatypeDict['bin']]

    #get pearson correlations for output
    #do the appropriate preprocessing for each of your data
    dynamicAttr = attrPreProcessing4Lee(pd.Series(parm['dynamicData'][parm['layerA']]),xys)
    attrDF      = attrPreProcessing4Lee(attrDF,xys)

    #if the dynamic attribute is already in the data then we want to remove
    # it so there is no self comparison.
    try:
        attrDF.drop(parm['layerA'],axis=1,inplace=True)
    except ValueError:
        '''do nothing'''

    #get pearson correlation of all attributes
    simV= 1-(sklp.pairwise_distances(dynamicAttr.reshape(1,-1),attrDF.transpose(),metric='correlation',n_jobs=8)[0,:])

    leeslV = singleLeesL(spatialWieghtMatrix(xys),dynamicAttr,attrDF)

    writeToFileLee(parm['tempFile'],leeslV,simV,attrDF.columns)

    #return the output file for dynamic stats
    return parm['tempFile']
