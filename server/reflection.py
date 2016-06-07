#!/usr/bin/env python2.7

import pandas as pd
import os

def topXbinTrans(df,top):
    '''


    :param df: a dataframe with a single column
    :return:outputs a dataframe with single column and same indecies as df, 3 is 'high, 2 is 'middle', and 1 is 'low'
    '''


    nrows = df.shape[0]
    df = df.sort_values(ascending=False)

    df.iloc[0:(top)] = 3
    df.iloc[nrows-top:nrows] = 2 #
    df.iloc[top:-top] = 1

    return pd.Series(df)

def fromNodejs(parm):
    return reflection(parm)

def reflection(parm):
    '''

    :param parm: {
                  "datapath": relfection_data_file_name
                  "toMapId" : 'sample' or 'feature'
                  "node_ids" = [ id1,...,idn ]
                  "out_file"=outputfile_path
                  }
    :return: writes tab delimited output file, describing the highest and lowest node reflection
    '''

    TOP = 150 #this should be an input later, need to talk to Yulia and Josh before getting fancy

    fpath = str(parm['datapath'])
    outpath = parm['out_file']

    if not os.path.isfile(fpath):
        print "Error:", fname, "not found, so reflection could not be computed\n"
        return 0

    #
    # read in data to perform query on
    '''
    fpath = '/home/duncan/PycharmProjects/tumorMap/querrier/TMtoG/6nNquerryMatSampsxovery.pi'
    '''
    ref_dat = pd.read_pickle(fpath)

    #if going from features to samples then need to transpose matrix
    if (parm['toMapId'] == 'sample'):
        ref_dat = ref_dat.transpose()

    node_ids = parm['node_ids']

    '''
    node_ids = ref_dat.columns.values.tolist()[22:45]
    '''
    #grab row wise means and standard deviation for querry normalization
    rowmu = ref_dat.mean(axis=1)
    #take sd of each row
    rowstd = ref_dat.std(axis=1)

    #write the result to out_file name
    res = ( (ref_dat[node_ids].mean(axis=1) - rowmu) / rowstd)#

    #grab highest and lowest values and turn into: 3 highest , 2 middle, 1 lowest. 3 and 1 are of particular interest
    res = topXbinTrans(res,TOP).to_dict()

    #outpath='reflect_ex.tab'
    #res.to_csv(outpath,sep='\t') #output is without header

    return res
    #return 0

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = reflection(sys.argv[1])
    except:
        traceback.print_exc()
        # Return a definite number and not some unspecified error code.
        return_code = 1

    sys.exit(return_code)
