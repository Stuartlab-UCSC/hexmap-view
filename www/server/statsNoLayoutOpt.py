'''
This is an optimized version of our pairwise attribute statistics.
Instead of using the lower level paralell processing of initiallizing n**2 classes
 it takes advantage of the parallel processing implemented in sklearn

 Notable changes:
      If a test fails and returns NA, we will not set that values to 1
       because a p-values of NA or 1 have very differnent meaning

 Notes on implementation:
  In order to take advantage of sklearn's parallel all-pairwise computation, and maintain
  the pairwise-complete observation of the statistical tests (i.e. nodes with Na in either of the
  attributes are not considered for the tests.), we must code Na's as appropriate real valued
  numbers.
  This only occurs within functions in this module and will not affect any other programs
  using this module.

  For binary and categorical data types -1 is used to represent a value of NA

  For continuous data types, the maximum float value is used. The argument for choosing this value
    is that it should not occur naturally because of the dangers of overflow.

  Those decisions can be easily changed by setting the globals below.
  ---------------
  Adjustments are done in the write*() function
'''
import pandas as pd
import numpy as np
import sklearn.metrics.pairwise as sklp
from scipy import stats
from layout import getAttributes
from leesL import getLayerIndex
from leesL import readLayers
import statsmodels.sandbox.stats.multicomp as multicomp


#globals numbers used to represent NA values
FLOATNAN  = np.finfo(np.float64).max
BINCATNAN = -1

def filterBinCat(x,y):
    '''
    filters bin-bin bin-cat combos
    @param x:
    @param y:
    @return:
    '''
    eitherNan = np.logical_or(x==BINCATNAN,y==BINCATNAN)
    x=x[~eitherNan]
    y=y[~eitherNan]
    return x,y

def filterBinOrCatCont(bincatX,contY):
    '''
    note that the variables have ot be in the correct order for this to work.
    @param bincatX:
    @param contY:
    @return:
    '''
    eitherNan = np.logical_or(bincatX==BINCATNAN,contY==FLOATNAN)
    bincatX=bincatX[~eitherNan]
    contY=contY[~eitherNan]
    return bincatX,contY

def filterCont(x,y):
    '''
    both x and y are continuos
    @param x:
    @param y:
    @return:
    '''
    eitherNan = np.logical_or(x==FLOATNAN,y==FLOATNAN)
    x=x[~eitherNan]
    y=y[~eitherNan]
    return x,y
###############################################################################################3
###################################DM122016####################################################3
#these are the individual functions for calculating layout-independent statistics, i.e.
# statistics for all pairwise associations of the meta data
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
        modkey = tuple(map(lambda x: int(x)-1,key))

        table[modkey] = len(groupDict[key])

    return table

def binBinTest(x,y):
    #filter out bad values
    x,y = filterBinCat(x,y)
    #build contingency table
    table = contingencyTable(x,y)
    #if contingency table for binaries doesn't have this shape,
    # then there are no observations for one of the binary variables values
    # e.g. after Na's are filtered there are only 1's present in one of the attributes,
    # statistics can not accurately be computed
    if table.shape != (2,2):
        return np.NAN
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
    x,y = filterCont(x,y)
    correlation, pValue = stats.pearsonr(x,y)
    return pValue

def catContTest(catx,conty):

    catx, conty = filterBinOrCatCont(catx,conty)

    groups = pd.DataFrame([catx,conty]).transpose().groupby([0])

    samples = groups.aggregate(lambda x: list(x))[1].tolist()
    stat, pValue = stats.mstats.kruskalwallis(*samples)

    return pValue

def binContTest(binx,conty):
    binx, conty = filterBinOrCatCont(binx,conty)
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

def stitchTogether(biXbi,caXbi,biXco,coXco,caXco,caXca):
    '''
    this function takes the results from each of the pairwise
    computations and stiches them together into one data frame so they
    can be written out easily
    @param biXbi:
    @param caXbi:
    @param coXbi:
    @param coXco:
    @param caXco:
    @param caXca:
    @return:
    '''
    #stich together rows of individual datatypes
    bins = pd.concat([biXbi,caXbi,biXco.transpose()],axis=0)
    conts = pd.concat([coXco,biXco,caXco],axis=0)
    cats = pd.concat([caXca,caXbi,caXco],axis=1).transpose()

    return pd.concat([bins,conts,cats],axis=1)

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
    #attrDF = getAttributes(read_matrices('/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsExp'))
    #datatypeDict = read_data_types('/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsExp')
    #separate the metadata out into the perspective data types
    binAtts = attrDF[datatypeDict['bin']]
    binAtts = binAtts.fillna(BINCATNAN)

    catAtts = attrDF[datatypeDict['cat']]
    catAtts = catAtts.fillna(BINCATNAN)

    contAtts = attrDF[datatypeDict['cont']]
    catAtts = catAtts.fillna(FLOATNAN)

    binAtts = binAtts[binAtts.columns[-3:-1]]

    #x= binAtts[binAtts.columns[0]]
    #y= binAtts[binAtts.columns[1]]

    #Do all by alls and convert to pandas dataframe
    # naming scheme:
    #bi == binary , co == continuous , ca == categorical
    #xxXyy == xx in the rows, yy are the columns
    biXbi = sklp.pairwise_distances(binAtts.transpose(),metric=binBinTest)
    biXbi = pd.DataFrame(biXbi,columns=datatypeDict['bin'],index=datatypeDict['bin'] )
    #
    coXco = sklp.pairwise_distances(contAtts.transpose(),metric=contContTest)
    coXco = pd.DataFrame(coXco,columns=datatypeDict['cont'],index=datatypeDict['cont'] )
    #
    caXca = sklp.pairwise_distances(catAtts.transpose(),metric=catBinOrCatCatTest)
    caXca = pd.DataFrame(coXco,columns=datatypeDict['cat'],index=datatypeDict['cat'] )
    #
    caXbi = sklp.pairwise_distances(catAtts.transpose(),binAtts.transpose(),metric=catBinOrCatCatTest)
    caXbi = pd.DataFrame(caXbi,columns=datatypeDict['bin'],index=datatypeDict['cat'] )
    #
    caXco = sklp.pairwise_distances(catAtts.transpose(),contAtts.transpose(),metric=catContTest)
    caXco = pd.DataFrame(caXco,columns=datatypeDict['cont'],index=datatypeDict['cat'] )
    #
    biXco = sklp.pairwise_distances(binAtts.transpose(),contAtts.transpose(),metric=binContTest)
    biXco = pd.DataFrame(biXco,columns=datatypeDict['cont'],index=datatypeDict['bin'] )
    '''
    all = stitchTogether(biXbi,caXbi,biXco,coXco,caXco,caXca)
    '''
    return stitchTogether(biXbi,caXbi,biXco,coXco,caXco,caXca)

def writeToDirectoryStats(dirName,allbyall,layers):


    assert(dirName[-1] == '/')

    for column in allbyall.columns:
        #print getLayerIndex(column,layers)
        statsO = pd.DataFrame(index= allbyall.index)
        statsO[0] = allbyall[column] #uncorrected pvalues

        statsO = statsO.iloc[statsO.index!=column] #get rid of identity

        #run the adjusted pvalues
        reject, adjPvals, alphacSidak, alphacBonf = multicomp.multipletests(statsO[0].values, alpha=0.05, method='fdr_bh')
        reject, adjPvalsB, alphacSidak, alphacBonf = multicomp.multipletests(statsO[0].values, alpha=0.05, method='bonferroni')

        statsO[1] = adjPvals
        statsO[2] = adjPvalsB

        filename = 'stats_'+ getLayerIndex(column,layers)+ '.tab'

        statsO.to_csv(dirName+filename,sep='\t',header=None)

all = all.fillna(1)
layersfile = '/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsExp/layers.tab'
writeToDirectoryStats('/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/statsFromOpt/',all,readLayers(layersfile))
def runAllbyAllForUI(dir,layers,attrDF,dataTypeDict):

    writeToDirectoryStats(dir,allbyallStatsNoLayout(attrDF,dataTypeDict),layers)

    return None