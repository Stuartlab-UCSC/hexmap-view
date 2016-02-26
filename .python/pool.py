#!/usr/bin/env python2.7
"""
pool.py: Use a multiprocessing pool to handle spawning of subprocesses to 
multiple processors
"""
import multiprocessing, socket, datetime, pprint, traceback

# For sub-processes, use all the processors available, or 32 on juggernaut
hostname = socket.gethostname()
if hostname == 'juggernaut':
    MAX_JOB_COUNT = 32
else:
    MAX_JOB_COUNT = multiprocessing.cpu_count()
    if MAX_JOB_COUNT < 1:
        MAX_JOB_COUNT = 8

def timestamp():
    return str(datetime.datetime.now())[8:-7]

def hostProcessorMsg():
    return 'Using host: ' + hostname + ' with ' + str(MAX_JOB_COUNT) + ' processors for parallel jobs.'

def runFunctor(functor):
    """
    Given a no-argument functor (like a ClusterFinder), run it and return its 
    result. We can use this with multiprocessing.map and map it over a list of 
    job functors to do them.
    
    Handles getting more than multiprocessing's pitiful exception output
    """
    try:
        return functor()
    except:
        # Put all exception text into an exception and raise that
        raise Exception(traceback.format_exc())

def runSubProcesses(jobs):
    # Create the pool and run the subprocesses under it.
    # @param job: the subprocess function and its parameters to the function

    # This holds a multiprocessing pool for parallelization
    pool = multiprocessing.Pool(MAX_JOB_COUNT)
   
    # This holds all the return values in the same order as the jobs submitted
    poolResults = pool.map(runFunctor, jobs)
    
    # Close down the pool so multiprocessing won't die sillily at the end
    pool.close()
    pool.join()

    return poolResults