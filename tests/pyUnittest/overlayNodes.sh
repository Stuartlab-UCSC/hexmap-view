#!/bin/bash
# overlayNodes.sh
#
# Test the execution of the script via a bash shell
#
# $1 is the meteor app install directory, i.e.: /Users/swat/dev/hexagram
# $2 is a tmp dir that is cleaned up by the operating system, i.e.: /tmp
# $3 is the results base filename in the tmp dir, i.e.: overlayNodesResults.json

appInstallDir=$1
tmpDir=$2
resultsFile=$tmpDir/$3

scriptDir=$appInstallDir/www/server
dataDir=$appInstallDir/tests/pyUnittest/testData
logFile=$tmpDir/overlayNodes.log

python2.7 $scriptDir/compute_pivot_vs_background.py \
    --in_pivot $dataDir/overlayNodesQuery.json \
    --in_meta $dataDir/overlayNodesMeta.json \
    --out_file $resultsFile \
    --log $logFile\
    --num_jobs 0 \
    --neighborhood_size 6
