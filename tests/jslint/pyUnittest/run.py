import sys, os
sys.path.append('../../')

def runPy():
    import hexagram
    rootDir = '/Users/swat/hex-stats'
    inDir = 'pyIn/'
    class Options:
        def __init__(s):
            s.associations = True
            s.colormaps = inDir + 'colormaps.txt'
            s.directory = 'pyOutTest'
            s.drlpath = None
            s.html = 'test.dat'
            s.mi_binary_binning = True
            s.mi_window_size = 25
            s.mi_window_threshold = 30
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
    os.chdir(rootDir)
    hexagram.hexIt(options)
    os.chdir('tests/unittest')


if __name__ == '__main__':
    runPy()
