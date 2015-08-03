import sys, os

def runPy():
    rootDir = '/Users/swat/dev/hexagram/'
    serverDir = rootDir + 'server/'
    inDir = rootDir + 'tests/pyUnittest/pyIn/'
    outDir = rootDir + 'tests/pyUnittest/pyOutTest/'
    testDir = rootDir + 'tests/pyUnittest'
    print 'serverDir', serverDir
    sys.path.append(serverDir)
    import hexagram
    class Options:
        def __init__(s):
            s.associations = True
            s.colormaps = inDir + 'colormaps.txt'
            s.directory = outDir
            s.drlpath = None
            s.html = 'test.dat'
            s.mi_binary_binning = False # True
            s.mi_window_size = 30 # 25
            s.mi_window_threshold = 4 # 30
            s.mutualinfo = True
            s.names = ['mRNA seq']
            s.query = None
            s.raw = None
            s.rawsim = None
            s.scores = [inDir + 'old_attributes.csv']
            s.similarity = [inDir + 'artificial_sparse.tab']
            s.singletons = False
            s.stats = True
            s.truncation_edges = 10
            s.type = None
            s.window_size = 20

        def printIt(s):
            print json.dumps(s, indent=4, sort_keys=True)

    options = Options();
    os.chdir(serverDir)
    hexagram.hexIt(options)
    os.chdir(rootDir + 'tests/pyUnittest')


if __name__ == '__main__':
    runPy()
