#!/usr/bin/env python2.7

import pandas as pd
import os
import json
import traceback
import sys
import time

#def get_functions():
#    return {mean:mean,}


def topXbinTrans(df,top):
    '''


    :param df: a dataframe with a single column
    :return:outputs a dataframe with single column and same indecies as df, 3 is 'high, 2 is 'middle', and 1 is 'low'
    '''


    nrows = df.shape[0]
    df = df.sort_values(ascending=False)

    df.iloc[0:(top)] = 2
    df.iloc[nrows-top:nrows] = 0 #
    df.iloc[top:-top] = 1

    return pd.Series(df)




def cnv_reflection(parm):
    #clockstart = time.time()

    #TODO: implement 'read in chunks' for large dataframes. or find a good way to do it

    try:
        TOP = int(parm['n'])
    except KeyError:
        TOP = 150 #TODO: this should be an input later, need to talk to Yulia and Josh before getting fancy

    fpath = str(parm['datapath'])
    node_ids = parm['node_ids']

    if not os.path.isfile(fpath):
        #TODO: Need better way for error, this error actually
        # gets dumped into mongo
        print "Error:", fpath, "not found, so reflection could not be computed\n"
        return 0

    # read in data to perform query on
    #ref_dat = pd.read_pickle(fpath)
    ref_dat = pd.read_csv(fpath,index_col=0,sep='\t')

    #if going from features to samples then need to transpose matrix
    if (parm['featOrSamp'] == 'feature'):
        ref_dat = ref_dat.transpose()

    #Ignore any node_ids passed that are not in the reflection matrix
    node_ids = [node for node in node_ids if node in ref_dat.columns.values.tolist() ]

    if (len(node_ids) ==0):
        print "Error:", fpath, "none of the nodes selected were in the reflection matrix\n"
        return 0

    #TODO: For efficency sake we could store the below calcs of mean and std
    # and only read
    # in the necessary columns, we'd need to store a transpose though
    # or get fancy some other way

    #calculate raw scores, store in dataframe
    res = ref_dat[node_ids].mean(axis=1)

    #NA's are filled with 0, 0 should be the most nuetral value
    # if not done NA's will pop up in the top LOW category
    #res.fillna(value=0, inplace=True)

    #grab highest and lowest values and turn into: 3 highest , 2 middle, 1 lowest. 3 and 1 are of particular interest
    res = topXbinTrans(res,TOP).to_dict()

    #open('refTime1','a').write(str(time.time() - clockstart) + ' seconds\n')

    return res


def exp_reflection(parm):
    '''

    :param parm: {
                  "datapath": relfection_data_file_name
                  "featOrSamp" : 'sample' or 'feature' this descrobes the node_ids
                  "node_ids" = [ id1,...,idn ]
                  }
    :return:
    '''
    
    #clockstart = time.time()

    #TODO: implement 'read in chunks' for large dataframes. or find a good way to do it

    try:
        TOP = int(parm['n'])
    except KeyError:
        TOP = 150 #TODO: this should be an input later, need to talk to Yulia and Josh before getting fancy


    fpath = str(parm['datapath'])
    node_ids = parm['node_ids']

    if not os.path.isfile(fpath):
        #TODO: Need better way for error, this error actually 
        # gets dumped into mongo
        print "Error:", fpath, "not found, so reflection could not be computed\n"
        return 0

    # read in data to perform query on
    #ref_dat = pd.read_pickle(fpath)
    ref_dat = pd.read_csv(fpath,index_col=0,sep='\t')
        
    #if going from features to samples then need to transpose matrix
    if (parm['featOrSamp'] == 'feature'):
        ref_dat = ref_dat.transpose()

    #Ignore any node_ids passed that are not in the reflection matrix
    node_ids = [node for node in node_ids if node in ref_dat.columns.values.tolist() ]

    if (len(node_ids) ==0):
        print "Error:", fpath, "none of the nodes selected were in the reflection matrix\n"
        return 0

    #TODO: For efficency sake we could store the below calcs of mean and std 
    # and only read
    # in the necessary columns, we'd need to store a transpose though
    # or get fancy some other way

    #grab row wise means and standard deviation for querry normalization
    rowmu = ref_dat.mean(axis=1)
    #take sd of each row
    rowstd = ref_dat.std(axis=1)

    #calculate raw scores, store in dataframe
    res = ( (ref_dat[node_ids].mean(axis=1) - rowmu) / rowstd)#

    #NA's are filled with 0, 0 should be the most nuetral value
    # if not done NA's will pop up in the top LOW category
    res.fillna(value=0,inplace=True)

    #grab highest and lowest values and turn into: 3 highest , 2 middle, 1 lowest. 3 and 1 are of particular interest
    res = topXbinTrans(res,TOP).to_dict()

    #open('refTime1','a').write(str(time.time() - clockstart) + ' seconds\n')

    return res

functionDictionary = {'mRNA': exp_reflection , 'CNV' : cnv_reflection, 'miRNA':exp_reflection,'RPPA':exp_reflection, 'Methylation': exp_reflection}

def fromNodejs(parm):
    return(functionDictionary[parm['datatype']](parm))


if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.

        #if calling from main then assume argument is a json formatted file
        # and output the values so different implementations can be compared
        return_code = out_values(fromNodejs(read_json(sys.argv[1])))
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1

    sys.exit(return_code)