#!/usr/bin/env python2.7
# testutil.py
# This tests javascript, using python's easier calls to shell commands
# from here than from mocha

import sys, os, glob, filecmp, subprocess, json, tempfile, pprint, shutil
from os import path
import string
import unittest
from scipy import stats

from rootDir import getRootDir
import pandas as pd

rootDir = getRootDir()
testDir = rootDir + 'tests/pyUnittest/'

PYTHONPATH = rootDir + 'www/server'
os.environ["PYTHONPATH"] = PYTHONPATH

def findCurlStatusCode(verbose):
    i = verbose.find('< HTTP/1.1')
    return verbose[i+11:i+14]
    
def cleanCurlData(dataOut):
    data = dataOut

    # if this is an error message ...
    if dataOut[0] != '{':
        data = dataOut.replace('\n', '')
        
    return data
    
def doCurl(opts, url):
    o, outfile = tempfile.mkstemp()
    e, errfile = tempfile.mkstemp()
    with open(outfile, 'w') as o:
        e = open(errfile, 'w')
        curl = ['curl', '-s', '-k'] + opts + [url]
        #print 'curl:\n', curl, '\n\n'
        subprocess.check_call(curl, stdout=o, stderr=e);
        e.close()
    with open(outfile, 'r') as o:
        e = open(errfile, 'r')
        data = cleanCurlData(o.read());
        code = findCurlStatusCode(e.read());
        e.close()
    os.remove(outfile)
    os.remove(errfile)
    return {'data': data, 'code': code}

def removeOldOutFiles(outDir):
    try:
        shutil.rmtree(outDir)
    except:
        pass
    os.makedirs(outDir)

def compareActualVsExpectedDir(s, outDir, expDir,excludeFiles=['log']):
    os.chdir(expDir)
    expFiles = glob.glob('*')
    expFiles.sort()
    os.chdir(outDir)
    outFiles = glob.glob('*')
    outFiles.sort()
    
    # Verify the filenames are those expected
    #print 'outFiles', outFiles
    #print 'expFiles', expFiles
    s.assertTrue(outFiles == expFiles,
                 msg='Differences in file names: ' +
                     str( set(expFiles).symmetric_difference(set(outFiles)))
                 )

    # Compare the file contents with the expected
    # Returns three lists of file names: match, mismatch, errors
    diff = filecmp.cmpfiles(outDir, expDir, expFiles)

    #Files given by the exludeFiles list we know will be different,
    # so ignore them
    for file in excludeFiles:
        if file in diff[1]: #in case we are comparing dirs without a log file
           diff[1].remove(file)

    mismatch = diff[1]

    s.assertTrue(mismatch == [] or mismatch == None,
                 msg='mismatching files: ' + str(mismatch)
                 ) # mismatched files
    
    # There should be no errors resulting from the diff
    #if diff[2] != []:
    #    print 'errors comparing files: ' + str(diff[2])
    s.assertTrue(diff[2] == [],
                 msg='Errors with diff: ' + str(diff[2])
                 ) # errors

def compareActualVsExpectedFile(s, fname, outDir, expDir):
    
    # Verify the directory exists
    s.assertTrue(path.exists(outDir))

    # Verify the file exists
    s.assertTrue(path.isfile(path.join(outDir,fname)),
                 msg='is not a file: ' + path.join(outDir,fname))

    # Compare the file contents
    s.assertTrue(filecmp.cmp(path.join(outDir,fname),path.join(expDir,fname)),
                 msg='file did not match: ' + fname)
    

def gen_dat(nrows=50,ncols=40,mu=0,std=1):
    '''
    :param nrows: number of rows in the 2d array
    :param ncols: number of cols in the 2d array
    :param mu:    mean for random generation
    :param std:   standard deviation for random generation
    :return: returns a random 2d numpy array, generated with normal distribution
    '''

    '''
    :return: generates random data
    '''
    return stats.norm.rvs(loc=mu, scale=std, size=(nrows,ncols))

def getdf(fin='',type_='tab',rownamecol=0,nrows=50,ncols=40):
    '''
    :param fin: name of the tab delimited file to read in
    :param type_: either 'tab','practice', 'random', practice reads in only 3000 rows
    :param rownamecol: the columns of the row identifiers
    :return: pandas dataframe
    '''
    if type_ == 'tab':
        return pd.read_csv(fin,sep='\t',index_col=rownamecol)

    if type_ == 'practice':
        print('warning: func read_dat is of type: ' +type_)
        return pd.read_csv(fin,sep='\t',index_col=rownamecol,nrows=3000)
    if type_ == 'random':
        return pd.DataFrame(gen_dat(nrows,ncols),index=range(0,nrows),
                            columns=range(0,ncols))
    else:
        return "SOME WENT WRONG"
