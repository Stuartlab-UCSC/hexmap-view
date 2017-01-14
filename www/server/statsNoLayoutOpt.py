'''
This is an optimized version of our pairwise attribute statistics.
Instead of using the lower level paralell processing of initiallizing n**2 classes
 it takes advantage of the parallel processing implemented in sklearn

 Notable changes:
      If a test fails and returns NA, we will not set that values to 1
       because a p-values of NA or 1 have very differnent meaning
'''
import pandas as pd
import numpy as np
import sklearn.metrics.pairwise as sklp
from scipy import stats
from layout import getAttributes

###############################################################################################3
###################################DM122016####################################################3
#these are the individual functions for calculating layout-independent statistics, i.e.
# statistics for all pairwise assosiations of the meta data
def contingencyTable(x,y):
    '''
    :param x: discrete numpy array
    :param y: discrete numpy array
    :return: a contingency table representing the co-occurence of discrete values,
             y is the column x is the row
    '''
    x_n = len(set(x))
    y_n = len(set(y))

    # a dict of combinations present and the indecies for which they occur
    groupDict = pd.DataFrame([x,y],index=[0,1]).transpose().groupby([0,1]).groups

    #intialize matrix that represents all all prosible combinations of the two discrete vars
    table = np.repeat(0,x_n*y_n).reshape(x_n,y_n)

    #fill in each combo that we have data for
    for key in groupDict.keys():
        #must modify the key to prevent off by one error when
        # accessing matrix
        modkey = tuple(map(lambda x: x-1,key))

        table[modkey] = len(groupDict[key])

    return table

def binBinTest(x,y):
    #build contingency table
    table = contingencyTable(x,y)
    oddsratio, pValue = stats.fisher_exact(table)
    return pValue

def catBinOrCatCatTest(x,y):
    '''
    handles binary and categical or categorical ccategorical
    '''
    #build contingency table
    table = contingencyTable(x,y)
    chi2, pValue, dof, expectedFreq = stats.chi2_contingency(table)

    return(pValue)

def contContTest(x,y):
    correlation, pValue = stats.pearsonr(x,y)
    return pValue

def contCatTest(catx,conty):
    groups = pd.DataFrame([catx,conty]).transpose().groupby([0])

    samples = groups.aggregate(lambda x: list(x))[1].tolist()
    stat, pValue = stats.mstats.kruskalwallis(*samples)

    return pValue

def contBinTest(binx,conty):
    groups = pd.DataFrame([binx,conty]).transpose().groupby([0])

    samples = groups.aggregate(lambda x: list(x))[1].tolist()
    stat, pValue = stats.ranksums(*samples)
    return pValue

################################################################################################3
################################################################################################3

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

def allbyallStatsNoLayout(attrDF,datatypeDict):
    '''
    @param projectDir:
    @param attrDF:
    @param attributeFileList:
    @param datatypeDict:
    @return:
    '''
    '''
    Computes all by all statistical tests for attributes
    @param projectDir:
    @param attributeFileList:
    @param datatypeDict:
    @return:
    '''
    attrDF = getAttributes(read_matrices('/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsExp'))
    datatypeDict = read_data_types('/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsExp')
    #separate the metadata out into the perspective data types
    binAtts = attrDF[datatypeDict['bin']]
    binAtts = binAtts.astype('int')
    catAtts = attrDF[datatypeDict['cat']]
    catAtts = catAtts.astype('int')
    contAtts = attrDF[datatypeDict['cont']]
    '''
    Hi future self, you are trying to get rid of a deprecation warning about not having integers.
    '''
    #all by all binary
    biXbi = sklp.pairwise_distances(binAtts.transpose(),metric=binBinTest)
    #all by all continuous
    coXco = sklp.pairwise_distances(contAtts.transpose(),metric=contContTest)
    #all by all categorical
    caXca = sklp.pairwise_distances(catAtts.transpose(),metric=catBinOrCatCatTest)
    #all by all categorical
    bXca = sklp.pairwise_distances(catAtts.transpose(),binAtts,metric=catBinOrCatCatTest)
    #all by all categorical
    coXca = sklp.pairwise_distances(contAtts.transpose(), catAtts.transpose(),metric=contCatTest)
    #all by all categorical
    coXbi = sklp.pairwise_distances(catAtts.transpose(),binAtts.transpose(),metric=contBinTest)

    '''
    binAtts.dtypes
    biXbi.shape
    catAtts.columns
    '''
    biXbi = pd.DataFrame(biXbi,columns=datatypeDict['bin'],index=datatypeDict['bin'] )