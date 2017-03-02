#!/usr/bin/env python2.7
'''



'''

from process_categoricals import *
from utils import getAttributes

def parse_args(args):

    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    # swat: We should be able to add 'required=True' to some args so the parser
    # will tell the user when they are left out. --directory should be required
    # since scripts get confused with relative paths sometimes.
    fins = []
    parser.add_argument('-i',"--codedAttrs", type=str,nargs='+',
                        help="Input: attributes/meta data tsv files separated by space",metavar=fins)

    parser.add_argument('-o',"--strAttrs", type=str,
        help="name of output file, defaults to str_attrs.tab",
                        default="str_attrs.tab")

    parser.add_argument('-c',"--colormaps", type=str,
                        help="path to a previously generated colormapping file",
                        )

    return parser.parse_args(args)


def main(args):

    sys.stdout.flush()
    opts = parse_args(args)

    #process input arguments:
    in_attributes = opts.codedAttrs
    out_file = opts.strAttrs
    colormaps = opts.colormaps

    print 'converting these files: ' + str(in_attributes)

    #get all the attributes into one place
    codedattrs    = getAttributes(in_attributes)
    #get colormaps into a list of lists
    colormaps     = read_colormaps(colormaps)
    #maps the attributes to a index in the colormap
    attrToIndex   = cmaps_index_dict(colormaps)
    #pulls out all the attributes from the colormap
    attrsWithCodes= get_attrs_from_cmaps(colormaps)

    #this dict creates the mapping that will change codes back to their strings
    replaceDict = {}
    for attr in attrsWithCodes:
        #if that entry is really in the data
        # then make the mapping for that attribute
        if attr in codedattrs.columns:
            cmapentry = colormaps[attrToIndex[attr]]
            replaceDict[attr] = dict(zip(get_indecies_from_cmaps_entry(cmapentry,type_='int'),
                                         get_cats_from_cmaps_entry(cmapentry)
                                         )
                                     )

    codedattrs.replace(replaceDict,inplace=True)
    #part of the expected format.
    codedattrs.index.rename('nodes',inplace=True)
    codedattrs.to_csv(out_file,sep='\t')

if __name__ == "__main__" :
    try:
        # Get the return code to return
        # Don't just exit with it because sys.exit works by exceptions.
        return_code = main(sys.argv[1:])
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        traceback.print_exc()
        traceback.print_exception(exc_type, exc_value, exc_traceback,
                                  limit=2, file=sys.stdout)

        # Return a definite number and not some unspecified error code.
        return_code = 1

    sys.exit(return_code)
