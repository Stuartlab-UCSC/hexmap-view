import pandas as pd

def topXbinTrans(df,top):
    '''

    output a binary vector 1 for the top t genes, 0 otherwise, will throw away rest of matrix
    :param df: a dataframe with a single column
    :return:
    '''


    nrows = df.shape[0]
    df = df.sort_values(ascending=False)

    df.iloc[0:(top)] = 3
    df.iloc[nrows-top:nrows] = 1
    df.iloc[top:-top] = 2

    return df

def reflection(parm):
    '''

    :param parm: {
                  "datafile": relfection_data_file_name
                  "directory": relfection_data_file_directory.pi
                  "sample_or_feature" : sample
                  "node_ids" = [ id1,...,idn ]
                  "out_file"=outputfile
                  }
    :return: writes tab delimited output file, describing the highest and lowest node reflection
    '''

    TOP = 150 #this should be an input later, need to talk to Yulia and Josh before getting fancy

    fname = str(parm['datafile'])
    fpath = os.path.join(parm['directory'], fname)
    outpath = parm['out_file']

    if not os.path.isfile(fpath):
        print "Error:", fname, "not found, so reflection could not be computed\n"
        return 0

    ref_dat = pd.read_pickle(fpath)

    #if going from features to samples then need to transpose matrix
    if (parm['sampleOrFeature'] == 'feature'):
        ref_dat = ref_dat.transpose()

    node_ids = parm['node_ids']

    #grab row wise means and standard deviation for querry normalization
    rowmu = ref_dat.mean(axis=1)
    #take sd of each row
    rowstd = ref_dat.std(axis=1)

    #write the result to out_file name
    res = ( (ref_dat[node_ids].mean(axis=1) - rowmu) / rowstd)#

    #grab highest and lowest values and turn into: 3 highest , 2 middle, 1 lowest. 3 and 1 are of particular interest
    res = topXbinTrans(res,TOP)
    #outpath='reflect_ex.tab'
    res.to_csv(outpath,sep='\t')

    return 0

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