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
    """
    python /data/medbook-galaxy-central/tools/hexagram/hexagram.py \
    "/data/signatures/TCGA/PANCAN/paper/sparse_matrices/spearman/mRNA_pancan12_self_SPEARMAN_top_50" \
    "/data/signatures/TCGA/PANCAN/paper/sparse_matrices/spearman/cn_pancan12_self_SPEARMAN_top_50.tab" \
    --names "mRNA Seq" \
    --names "SCNA" \
    --scores "/data/signatures/TCGA/PANCAN/paper/attributes/genomic_events,_breast_subtype_,_tissue_scores.tab" \
    --scores "/data/signatures/TCGA/PANCAN/paper/subtypes/OV-Subtypes.tab" \
    --colormaps "/data/signatures/TCGA/PANCAN/paper/subtypes/colormaps.tab" \
    --html "/data/database/files/014/dataset_14909.dat" \
    --directory "hex_temp" \
    --truncation_edges 10
    """
    class Options:
        def __init__(s):
            s.associations = True
            s.colormaps = inDir + 'colormaps.txt'
            s.directory = outDir
            s.drlpath = None
            s.html = 'test.dat'
            s.mi_binary_binning = False # True default
            s.mi_window_size = 30 # 25 default
            s.mi_window_threshold = 4 # 30 default
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
