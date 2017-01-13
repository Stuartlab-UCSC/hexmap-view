#Yulia Newton
#python2.7 report_on_local_neighborhoods.py --in_neighborhoods neighbors.tab --in_sample XXX --in_attributes attr.tab --in_eucledian_positions x_y_assignments.CKCCv1.tab

import optparse, sys, os
import operator
import numpy

def main():
    parser = optparse.OptionParser()
    parser.add_option("--in_neighborhoods", dest="in_neighborhoods", action="store", default="", help="")
    parser.add_option("--in_sample", dest="in_sample", action="store", default="", help="")
    parser.add_option("--in_attributes", dest="in_attributes", action="store", default="", help="separated by comma")
    parser.add_option("--in_eucledian_positions", dest="in_eucledian_positions", action="store", default="", help="")
    opts, args = parser.parse_args()
    
    #process input arguments:
    in_neighborhoods = opts.in_neighborhoods
    in_sample = opts.in_sample
    in_attributes = opts.in_attributes
    in_eucledian_positions = opts.in_eucledian_positions
    
    #read neighborhoods:
    input = open(in_neighborhoods, 'r')
    neighbors = {}
    for line in input:
        line = line.strip().split("\t")
        if not(line[0] in neighbors):
            neighbors[line[0]] = {}
            
        neighbors[line[0]][line[1]] = float(line[2])
        
    input.close()

    if not(in_sample in neighbors):
        print >> sys.stderr, "ERROR: specified sample is not present in the local neighborhoods as a pivot"
        sys.exit(1)
    
    n = neighbors[in_sample]
    print >> sys.stdout, "Pivot sample: "+in_sample
    print >> sys.stdout, "Pivot neighbors: "+", ".join(n.keys())
    print >> sys.stdout, "Median local neighborhood similarity: "+str(numpy.median(n.values()))
    
    input = open(in_eucledian_positions, 'r')
    x_pos = []
    y_pos = []
    for line in input:
        line_elems = line.strip().split("\t")
        if line_elems[0] in n.keys():
            x_pos.append(float(line_elems[1]))
            y_pos.append(float(line_elems[2]))
    
    input.close()
    if not(len(x_pos) == len(y_pos)):
        print >> sys.stderr, "ERROR: number of x positions does not match number of y positions in the neighbors"
        sys.exit(1)
    
    #centroid_x = sum(x_pos) / len(x_pos)
    #centroid_y = sum(y_pos) / len(y_pos)
    centroid_x = numpy.median(x_pos)    #median
    centroid_y = numpy.median(y_pos)    #median
    print >> sys.stdout, "Pivot position in the map: ("+str(centroid_x)+", "+str(centroid_y)+")"
    print >> sys.stdout, "URL:"
    print >> sys.stdout, "https://tumormap.ucsc.edu/?p=CKCC/v3&node=" + \
        in_sample + "&x=" + str(centroid_x) + "&y=" + str(centroid_y)
    
    print >> sys.stdout, "\nSimilarity with individual neighbors (sorted in reverse):"
    for k in sorted(n, key=n.get, reverse=True):
        print >> sys.stdout, k + "\t"+str(n[k])    
    
    if len(in_attributes) > 0:
        attribute_files = in_attributes.split(",")
        for a in attribute_files:
            print >> sys.stdout, "\n"
            input = open(a, 'r')
            line_num = 0
            for line in input:
            
                line = line.replace("\n", "")
                
                #print 'line', line
                
                if line_num == 0:
                    print >> sys.stdout, line
                else:
                    line_elems = line.split("\t")
                    if line_elems[0] in n.keys():
                        print >> sys.stdout, line
            
                line_num += 1
            input.close()

main()
