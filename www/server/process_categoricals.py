#! /usr/bin/env python2.7
'''
    Author: Duncan McColl duncmc831@gmail.com
    Title:  process_categoricals.py (for use in tumor map server pipeline)
    
    Description: 
         This script does the necessary pre-processing of categical attributes. Namely, to create integer codes for
         categories and the category -> color mapping file (colormaps.tab) used by the Tumor Map Browser Server.
         It places the modified attributes in a single attributes file, either tab sep or pickle format

    The script performs two essenstial duties,
         1.) creating a category -> color mappings if they are not already present
         2.) transforming category strings into integer codes the Tumor Map software is expecting.

    If a previously generated colormaps.tab file is given, this script will make the appropriate integer mappings, and
         if necessary generate new colors for any categories present in the current metadata but not present in the
         given colormaps.tab file. It will also filter a given colormaps.tab. If there are attributes in the old 
         colormaps that are not in the metadata those entries will be taken out of the newly created colormaps. If an 
         entry is present, but some of the categories are not, the script will leave those categories out of the new colormap.tab. 

    Input:
         --colormaps     : the path/file name describing already provided category -> color mappings
                           see TumorMap help for file format description
         --directory     : directory to output transformed metadata and colormaps file
         --in_attributes : metadata provided names of tsv files seperated by a space
         --out_file      : name of colormaps file produced, default colormaps.tab
         --pickle        : name of transformed attributes, default allAttr.pi

    Modifications:
    code is now set up to pull from defaultColors() until they are exhausted.
     these defaults can be easily changed by putting new hexadecimal stings in that function
     the code must have at least one default or it will break.

    The code now excludes dark colors, it does so by using a minimum intensity on each
     bit when generating a random color. This can be changed my searhing from "minIntense";
     0 will allow all colors
'''
# Example:
#./create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab
#python2.7 create_colormaps.py --in_attributes attr.tab --out_file colormaps.tab

import sys, argparse
import numpy as np
import pandas as pd
from colormath.color_diff import delta_e_cmc
from colormath.color_objects import LabColor, sRGBColor
from colormath.color_conversions import convert_color
import traceback
from utils import getAttributes

#find a good place to set the seed... this isn't it
np.random.seed(1)

def parse_args(args):

    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    # swat: We should be able to add 'required=True' to some args so the parser
    # will tell the user when they are left out. --directory should be required
    # since scripts get confused with relative paths sometimes.
    fins = []
    parser.add_argument('-i',"--in_attributes", type=str,nargs='+',
                        help="Input: attributes/meta data tsv files separated by space",metavar=fins)

    parser.add_argument('-o',"--out_file", type=str,
        help="name of the colormaps file, defaults to colormaps.tab",
                        default="colormaps.tab")

    parser.add_argument('-c',"--colormaps", type=str,
                        help="Optional: path to a previously generated colormapping file",
                        default='')

    parser.add_argument('-p',"--pickle",type=str,
        help="optional output: name of the transformed metadata in a pickle file, .pi file extension",
                        default ="")
    # swat: just curious, what would we use this pickle file for?

    parser.add_argument('-a',"--attributes",type=str,
        help="optional output: name of the transformed metadata in a tsv file, .tab file extension",
                        default ="")

    parser.add_argument('-d',"--directory",type=str,
        help="the directory that output, both colormaps and pickle, is sent too",
                        default ="")
    
    return parser.parse_args(args)

def colorPicker(colors, n=100):
    '''
    picks a color that is most different from the colors given in 'colors'
    does so by generating random colors and using a distance function to choose the one that has the largest 
    minimum distances, i.e. that is most distiguishable from the colors in 'colors' 
    
    :param colors: an array of Lab color objects from the colormath module
    :param n: the number of random colors to generate and choose from 
    :return: the color that was most different (had the maximum minium-distance to any other color in 'colors'
    '''

    dcolors = defaultColors()
    if len(colors) < len(dcolors):
        pickAColor=dcolors
    else:
        pickAColor = Nrandomcolors(n)

    mindistances = []

    #check the distances of the random generated colors to the provided colors.
    # we are interested in the next color which is farthest away from its closest color that you already have
    # so we look at the distances from each new color to all provided colors and we keep the miniumn
    # then we keep the color that provides the maximum minium distance...

    #print randcolors
    for newcolor in pickAColor:

        distances = []
        for havecolor in colors:
            distances.append(delta_e_cmc(newcolor,havecolor))

        mindistances.append(np.min(distances))

    return (np.array(pickAColor)[mindistances == np.max(mindistances)][0])

def randomcolor(type_='Lab'):
    '''
	Note: this is where I would exclude picking the color black.

    makes a random color of the given type
    :param type_: only 'Lab' (default) and 'sRGB' are supported
    :return: a color picked at random
    '''

    #this did not exclude black
    #rgb = np.random.rand(1,3)[0].tolist()

    #this excludes black by adding a minimum intensity
    minIntense=40
    rgb = np.random.random_integers(minIntense,256,3).tolist()
    color = sRGBColor(rgb[0],rgb[1],rgb[2],is_upscaled=True)

    if type_ == 'Lab':
        color = convert_color(color,LabColor)
    if type_ != 'sRGB' and type_ != 'Lab':
        print 'ERROR: unsupported color type to randomcolor'
        return None
    else:
        return color

def Nrandomcolors(n):
    '''
    :param n: the number of random colors to be returned 
    :return:  an array of 'n' random colors
    '''
    return [randomcolor() for x in range(n)]

def defaultColors():
    '''
    # http://colorbrewer2.org Qualitative, 12-class Set3, minus the grey
    colors = [
        '#8dd3c7', '#ffffb3', '#bebada',
        '#fb8072', '#80b1d3', '#fdb462',
        '#b3de69', '#fccde5', '#bc80bd',
        '#ccebc5', '#ffed6f'
    ]
    '''
    colors = [
              '#0000FF','#00FF00','#00FFFF',
              '#FF0000','#FF00FF','#FFFF00',
              '#FFFFFF','#00007F','#00FF7F',
              '#007F00','#007FFF','#007F7F',
              '#FF007F','#FFFF7F','#FF7F00',
              '#FF7FFF','#FF7F7F','#7F0000',
              '#7F00FF','#7F007F'
              ]
    #change them to color objects
    colors = map(convertHexToLab,colors)
    return colors

def convertHexToLab(hexString):
    '''
    :param hexString: a hex-string color code 
    :return: a Lab colormath object
    '''
    c1 = sRGBColor.new_from_rgb_hex(hexString)
    return convert_color(c1,LabColor)

def convertHexStrArrayToLab(hexArr):
    '''
    :param hexArr: an array of hex-string color codes 
    :return: an array of Lab color math objects
    '''
    return map(convertHexToLab,hexArr)

def convertLabToHexStr(labColor):
    '''
    :param labColor: a Lab colormath object 
    :return: a hex-string color code
    '''
    return convert_color(labColor,sRGBColor).get_rgb_hex()

def chatter(str, prefix = ''):
    '''
    prints a message to stdout
    :param str: string you want to show the user
    :param prefix: should be 'WARNING' or 'ERROR' 
    :return: None
    '''
    print "process_categoricals.py: " + prefix + ": " + str

def read_colormaps(colormapsFile):
    '''
    reads a colormap formatted file into a list of lists
    :param colormapsFile: the name of the file
    :return: a list of lists described by the colormap format of Tumor Map
    '''
    
    #if we don't have a colormaps file then return an empty list to fill
    if colormapsFile == '':
        return []
    else:
        cfin = open(colormapsFile,'r')

        cmaps = []
        for line in cfin:
            cmaps.append(line.strip().split('\t'))

        return cmaps

def write_colormaps(outfile,cmaps):
    '''
    writes a colormap formatted file to a given out file
    :param outfile: the path/filename of the colormaps file that will be created
    :param cmaps: a colormap object, list of lists in specified format
    :return: None
    '''
    
    fout = open(outfile,'w')

    #copying the colormaps object to a file entry by entry
    for attrentry in cmaps:
        #only using 'place' for formatting, 
        for place,value in enumerate(attrentry):
            if place > 0:
                fout.write('\t' + str(value))
            else:
                fout.write(str(value))
        fout.write('\n')
    
    fout.close()

def duplicatesCheck(attrList):
    '''
    :param attrList: a list of objects
    :return: boolean describing whether the list had duplicates in it,
             and a list of those duplicated items.
    '''
    dups_present = len(attrList) != len(set(attrList))
    not_unique = []
    #want to return the duplicated attributes so we can properly complain
    if dups_present:
        seen = set()
        for attr in attrList:
            if attr not in seen:
                seen.add(attr)
            else:
                not_unique.append(attr)
    return dups_present, not_unique

def cmaps_index_dict(cmaps):
    '''
    returns a dictionary for easy lookup of attribute name -> index in the colormaps object
    :param cmaps: a colormaps object, i.e. list of lists with proper formatting 
    :return: returns a dictionary for easy lookup of attribute name -> index in the colormaps object
    '''
    return dict(zip(map(lambda x: x[0],cmaps),range(len(cmaps))))

def filter_cmaps(attrList,cmap):
    '''
    removes attributes (entries) from a colormap that are not in attrList
    :param attrList: an array of strings naming hte attributes you want colormap entries for
    :param cmap: colormaps object, list of list, proper format
    :return: filtered colormaps object
    '''

    return filter(lambda x: x[0] in attrList,cmap)

def get_cats_from_cmaps_entry(cmap_entry):
    '''
    :param cmap_entry: a single entry or row of a colormaps object 
    :return: the categories present in the colormaps entry
    '''
    #appropriate slicing to get categories
    return cmap_entry[2::3]

def get_indecies_from_cmaps_entry(cmap_entry,type_='str'):
    '''
    :param type_: type of output, 'int' or string
    :param cmap_entry: a single entry or row of a colormaps object 
    :return: the indecies present in the given colormaps entry
    '''
    #appropriate slicing to get indecies
    inds = cmap_entry[1::3]
    if type_ == 'int':
        inds = [int(x) for x in inds]

    return inds

def get_colors_from_cmaps_entry(cmap_entry):
    '''
    :param cmap_entry: a single entry or row of a colormaps object 
    :return: the colors present in the given colormaps entry
    '''
    #appropriate slicing to get colors
    return cmap_entry[3::3]

def get_attrs_from_cmaps(cmaps):
    '''
    :param cmaps: a colormaps object, list of list, proper format 
    :return: the attribute names for that colormap
    '''
    return map(lambda x: x[0],cmaps)

def metaVsCmaps(cmapCats,metaCats,attributeName,debug=False):
    '''
    compares the categories within an attribute present in the metadata and the colormap.

    chatters details of comparisons of metadata column and colormap entry
    
    :param attributeName: the name of the categorical attribute being investigated
    :param cmapCats: the categories present in the colormap for the attribute
    :param metaCats: the categories present in the metadata for the attribute
    :return: (boolean of whether the categories disagree,set(categoires in colormap not in metadata),set(categoriess
              in meta not in colormap))
    '''

    if debug:
        print 'this attribute: ' + attributeName
        print 'cmapCats: ' + str(cmapCats)
        print 'meataCats: ' + str(metaCats)
        print 'has those categories'

    cmapCats = set(cmapCats)
    metaCats = set(metaCats)
    disagrees = cmapCats.symmetric_difference(metaCats)
    disagreeance = len(disagrees)>0
    #if the categories disagree, print out specifics about what is going to be done about that

    inCmapNotMeta = set()
    inMetaNotCmap = set()


    if disagreeance:
        inCmapNotMeta = metaCats.difference(cmapCats)
        inMetaNotCmap = cmapCats.difference(metaCats)

        if len(inCmapNotMeta)>0:
            chatter("attribute: " + attributeName + ": " + str(len(inCmapNotMeta)) +' categories are in the provided colormap ' \
                    'file but not in the meta data' \
                                                                        '\n'+str(inCmapNotMeta),'WARNING')
        
        if len(inMetaNotCmap)>0:
            chatter("attribute-> " + attributeName + " : " + str(len(inMetaNotCmap)) +' categories are in the metadata ' \
                    'but not in colormaps file, new colors will be generated and added to the mappings for categories:' \
                                                                        '\n'+str(inMetaNotCmap),'WARNING')


    return disagreeance,inCmapNotMeta,inMetaNotCmap

# Unused. We want to keep all previous categories for now
def remove_cats_from_cmap_entry(cmap_entry,catsToRemove,debug=False):
    '''
    iteratively rebuilds the colormaps entry filtering unwanted categories.
     need to keep index's in proper order so can't just remove...

    :param cmap_entry:
    :param catsToRemove:
    :return:
    '''

    if debug:
        print 'from remove cats from cmap()'
        print 'cmap_entry:' + str(cmap_entry)
        print 'catsToRemove:' + str(catsToRemove)
    catsPresent = cmap_entry[2::3]

    newCmapEntry = []
    #add name of category
    newCmapEntry.append(cmap_entry[0])

    #set up indecies to go through
    catIndex = 2
    colorIndex = 3

    counter =0
    for cat in catsPresent:

        if  not cat in catsToRemove:

            #add to the new colormaps

            #use the new index...
            newCmapEntry.append(counter)
            counter+=1
            newCmapEntry.append(cmap_entry[catIndex])
            newCmapEntry.append(cmap_entry[colorIndex])

        catIndex +=3
        colorIndex+=3

    #print newCmapEntry
    return newCmapEntry

def transformToColormapInts(attrDF,colormaps,debug=False):
    '''
    :param attrDF: all meta data
    :param colormaps: a colormap mapping, a list of lists in the format specified by the tumor map software
    :return: a attrDF with categories replaced by their integer codes
    '''
    if debug:
        print 'transforming'
    for attrmap in colormaps:
        attrName = attrmap[0]
        cats = get_cats_from_cmaps_entry(attrmap)
        catIndexDict = dict(zip(get_cats_from_cmaps_entry(attrmap),get_indecies_from_cmaps_entry(attrmap)))

        for cat in catIndexDict.keys():
            #replace each category with the proper index
            attrDF[attrName].iloc[np.array(attrDF[attrName] == cat)] = catIndexDict[cat]

        #attrDF[attrName].astype('uint')

    attrDF = attrDF.apply(pd.to_numeric)

    return attrDF
'''
create_colormaps_file(['/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/in/layout/mcrchopra.atts.with_strs.tab'],
                      out_file='/home/duncan/trash/trash.cmaps.tab',
                      colormaps='/home/duncan/Desktop/TumorMap/TMdev/hexagram/tests/pyUnittest/in/layout/mcrchopra.colormaps.tab',
                      attrsfile='/home/duncan/trash/trash_attr.tab')
'''
def create_colormaps_file(in_attributes,out_file, pickle='', colormaps='', attrsfile='',debug=False):
    '''
    This function is the top of the hieracy of functions used for creating a
    colormapping file
    :param in_attributes: this is a list of file/pathnames for node metadata
    :param colormaps: an old colormap mapping that thet the user wishes to perserve
    :param out_file:  the new colormap mapping that will be written
    :param pickle:    the name of the concattenated attribute file
    :return:
    '''

    if debug:
        print '4 create_colormaps_file() arguements:'
        print in_attributes
        print out_file
        print pickle
        print colormaps

    #load metadata from different files and concat
    attributes = getAttributes(in_attributes)
    #attributes is a pandas dataframe

    if debug:
        print 'attribute names are:'
        print attributes.columns
        print attributes.head()

    #grab all the datatypes from the pandas dataframe
    datatypes = attributes.dtypes

    #find categorical attributes
    catAtts = attributes.columns[datatypes=='object']
    nCategoricals = len(catAtts)

    chatter( str(nCategoricals) + " categorical attributes detected in metadata")

    #make sure there are not duplicate attribute names because things will likely break down the line
    dups = duplicatesCheck(catAtts)
    if dups[0]: #dups are present
        raise ValueError, 'there are repeated attribute names in the metadata file: ' + str(dups[1])

    #reads the old colormaps file
    cmaps = read_colormaps(colormaps)

    if debug and colormaps != '':
        print 'colormaps read in' + str(cmaps)

    # if a colormapping file was given then things are more complicated...
    #   we are going to check and make sure that the provided colormaps describe all present categories.
    #   if not we need to add a category and a color, or remove one that is not present
    if len(cmaps)>0:
        chatter('previously generated colormaps file given')
        #chatter( str(len(cmaps)) + " categorical attributes in given colormaps")

        #categories from the given cmap are first string in the array...
        catsFromMap = map(lambda x: x[0],cmaps)

        dups = duplicatesCheck(catAtts)
        if dups[0]: #dups are present
            raise ValueError, 'there are repeated attribute names in colormaps file: ' + str(dups[1])

        #store all categoriccal attribute names that we have DATA AND A COLORMAP mapping for
        catsInMetaAndCMs = set(catsFromMap).intersection(catAtts)

        chatter(str(len(catsInMetaAndCMs)) + " attributes from colormap match metadata")

        #get rid of colormap entries that there is no meta data for
        cmaps = filter_cmaps(catsInMetaAndCMs,cmaps)

        #make a dictionary that can point you to the correct index in the array given the attribute name.
        cmapIndexLookup= cmaps_index_dict(cmaps)

        #this loop works on individual categorical descriptors within each of the categorical attributes
        #find out which colormaps entries do not have the proper categories and process...
        for categoricalAttr in list(catsInMetaAndCMs):
            if debug:
                print 'processing from colormaps.tab:' + categoricalAttr

            #get the colormapping entry we are working on
            cmapEntry = cmaps[cmapIndexLookup[categoricalAttr]]
            #get the categirical descriptors from the meta data column
            catsInMetaData = attributes[categoricalAttr].dropna().unique()
            #get the categorical descriptors from the colormap entry
            catsInCmaps = get_cats_from_cmaps_entry(cmapEntry)

            if debug:
                print 'processing from colormaps.tab:' + categoricalAttr
                print 'cmapEntry:' + str(cmapEntry)
                print 'catsInCmaps' + str(catsInCmaps)
                print catsInMetaData

            # if there is any disagreeance,
            #  things continue to special case out, otherwise we say 'yay'
            disagreeance,inCmapNotMeta,inMetaNotCmap = metaVsCmaps(catsInMetaData,catsInCmaps,categoricalAttr)


            #two cases:
            # if there is a categorical descriptor in the colormap, which is not in the metadata:
            #   then remove that from the meta data
            # if there is a categorical descriptor in the metadata, which is not in the colomapping
            #   then add this descriptor the the colormap mapping.
            if disagreeance:
                # take out any categories in the attribute that we don't have data for:
                # swat: maybe make this a command-line option?
                #cmapEntry = remove_cats_from_cmap_entry(cmapEntry,inCmapNotMeta)

                #now for any new category in the meta data, make a new color considering all the old colors
                # and append the new categoy to the end of the colormap entry
                for cat in inMetaNotCmap:
                    # get all the colors for that attribute
                    colors   = get_colors_from_cmaps_entry(cmapEntry)
                    #convert those to the type expected by the distance function
                    colors   = convertHexStrArrayToLab(colors)
                    #pick a new color out of 100 randomly generated ones
                    newColor = convertLabToHexStr(colorPicker(colors))
                    #the index for the new category
                    newIndex = int(cmapEntry[-3]) + 1

                    #add the new colormap entry to the end of the colormap
                    cmapEntry.append(str(newIndex))
                    cmapEntry.append(cat)
                    cmapEntry.append(newColor)

            #replace the old entry with the modified entry
            cmaps[cmapIndexLookup[categoricalAttr]] = cmapEntry

    #################################################################################################
    # now we have either an empty colormaps list->list, or a modified one.

    #grab categorical attribute names that are in the meta data but not in the 
    # colormap
    catAttsInMetaNotInCMs = set(catAtts).difference(set(get_attrs_from_cmaps(cmaps)))

    if debug:
        print 'cats in metadata not in CMs: ' + str(catAttsInMetaNotInCMs)
        print 'XXXcolormaps list of list: ' + str(cmaps)
    #make a new colormap entry for everthing not in the given (or not given) colormaps
    for catAtt in list(catAttsInMetaNotInCMs):
        if debug:
                print 'found category in metadata with no colormapping: ' + catAtt

        #start of a new entry
        cmapEntry = [catAtt]
        #get all the categorical descriptors in the meta data
        catsInMetaData = attributes[catAtt].astype('category')#.dropna(),dtype='category')
        cats = catsInMetaData.dropna().unique()

        #the below loop iteratively builds the colormap entry for this attribute
        #loop through each descriptor for the attribute and make a new color
        for counter, cat in enumerate(cats):

            if counter == 0:
                #no old colors
                newColor = defaultColors()[0]

            else:
                #get the old colors so we can pick a new one
                colors   = convertHexStrArrayToLab(get_colors_from_cmaps_entry(cmapEntry))
                newColor =  colorPicker(colors)

            #######make the next colormap entry
            cmapEntry.append(counter)
            counter+=1
            cmapEntry.append(cat)
            cmapEntry.append(convertLabToHexStr(newColor))
            ########

        #add new entry to the colormap
        cmaps.append(cmapEntry)

    ###################################################
    # now we have a completed colormap mapping in cmap.
    # Here we convert to integer codes and write out the data
    # as a pickle file
    attributes = transformToColormapInts(attributes,cmaps)
    attributes.index.rename('nodes',inplace=True)
    if debug:
        print cmaps
        print 'writing pickle to: ' + pickle
        print 'writing colormaps to: ' + out_file
        print 'writing tsv to: ' + attrsfile

    if len(pickle):
        attributes.to_pickle(pickle)
    if len(attrsfile):    
        attributes.to_csv(attrsfile, sep='\t')
    
    ###################################################
    if debug:
        print 'writing colormaps file to:' + out_file
    
    write_colormaps(out_file,cmaps)

    return 0

def main(args):
    
    sys.stdout.flush()
    opts = parse_args(args)
    
    ###################################################################################
    #process input arguments:
    in_attributes = opts.in_attributes
    out_file = opts.out_file
    pickleout = opts.pickle
    colormaps = opts.colormaps
    directory = opts.directory
    attrsfile = opts.attributes
    
    #append the output directory to the file names and paths
    if directory != '':
        #common mistake is to leave the '/' off of the directory string
        if directory[-1] != '/':
            chatter('adding backslash to directory')
            directory += '/'
        if len(out_file):    
            out_file = directory + out_file
        # swat: the standard way to handle this is always use os.path.join() to
        # join a dir with a file, or to join any sort of paths. That utility
        # adds a '/' if needed.  It can take two or more paths to join.
        if len(pickleout):        
            pickleout   = directory + pickleout
    
    ###################################################################################
    
    chatter('converting these files: ' + str(in_attributes))
    
    #main function for the script:
    create_colormaps_file(in_attributes, out_file, pickleout, colormaps, attrsfile)

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
