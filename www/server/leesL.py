#! /usr/bin/env python2.7
'''
File description coming soon.
'''

import pandas as pd
import sklearn.metrics.pairwise as sklp
from scipy import stats
import numpy as np
import scipy.spatial.distance as dist
from utils import sigDigs
from utils import truncateNP


#input/output helpers
def readLayers(layerFile):
    return pd.read_csv(layerFile,sep='\t',index_col=0,header=None)

def getLayerIndex(layerName,layers):
    filename = layers[1].loc[layerName]
    return filename[filename.index('_')+1:filename.index('.')]

def readXYs(fpath):
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

    layersTab[0] = pd.Series(layer_files)

    layersTab[1] = attributeDF[layer_files.keys()].count()

    layersTab[2] = np.repeat(np.NAN,len(layers.keys()))
    layersTab.loc[datatypes['bin'],2] = attributeDF[datatypes['bin']].sum(axis=0)

    for it, series_ in enumerate(densityArray):
        #fill all density with NAN in case we don't have some in the density array
        layersTab[3+it] = np.repeat(np.NAN,len(layers.keys()))
        #put the density in the dataframe
        layersTab[3+it] = series_.apply(sigDigs)



    layersTab.to_csv(options.directory + '/layers.tab',sep='\t',header=None)

def writeToDirectoryLee(dirName,leeMatrix,simMatrix,colNameList,layers,index):
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
        #two cases of output, if correlation is present then we need to
        # change the p-value so that attributes rank properly
        statsO[1] = 1- (stats.rankdata(np.abs(statsO[0]),method='average') / len(leeMatrix[i,]))

        statsO[2] = simMatrix[i,]
        #
        statsO = statsO.iloc[statsO.index!=column] #get rid of identity
        filename = 'statsL_'+ getLayerIndex(column,layers)+ '_' + str(index) + '.tab'

        statsO = statsO.apply(lambda x: x.apply(sigDigs))
        statsO.to_csv(dirName+filename,sep='\t',header=None)
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
    return (attrOnMap)
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

                #case out whether the map will have data
                if datMat.shape[0] == 0: #the attribute matrix has no rows, i.e. nodes with data
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
                #in case we lost any categories for the map we are looking at
                datMat = datMat[datMat.columns[datMat.sum() != 0]]
                datMat = ztransDF(datMat)
                if debug:
                    print 'categorical attribute being processed: ' + attr
                    print 'shape of dummy matrix after exclusion: ' + str(datMat.shape)
                if datMat.shape == (0,0):
                    print 'attribute ' + attr + ' had no values for this xy position set'
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

