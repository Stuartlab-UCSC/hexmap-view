#!/usr/bin/env python2.7
"""
norm_cirm_age.py

Example:  norm_cirm_age.py /Users/swat/data/layoutInput/brainOfCellsSwat

From an attributes file with codes or strings, create a new attribute
file with a new attribute of 'age_in_weeks' using 'age' and 'age_unit'.
"""

import sys, argparse, csv, traceback

CODES = True

def parse_args(args):
    args = args[1:]
    parser = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("dir", type=str, help="directory")
    a = parser.parse_args(args)
    return a

def get_xlate(row):
    i = 1
    code = 0
    xlate = []
    while True:
        try:
            j = int(row[i])
            str = row[i+1]
            xlate.insert(j, str)
            i += 3
        except:
            break;

    return xlate

def main(opt):

    dir = opt.dir
    color_file = dir + '/colormaps.tab'
    attr_file = dir + '/attributes.tab'
    norm_file = dir + '/attributes_with_age_in_weeks.tab'
    check_file = dir + '/attributes_age_only.tab'

    print 'processing:', attr_file
    
    if CODES:
    
        # Read in the code-to-value translations in the colormaps file
        with open(color_file, 'rU') as fin:
            fin = csv.reader(fin, delimiter='\t')
            age = []
            age_unit = []
            for row in fin:
            
                if row[0] == 'age':
                
                    print 'colormap row', row
                
                    age = get_xlate(row)
                if row[0] == 'age_unit':
                
                    print 'colormap row', row
                
                    age_unit = get_xlate(row)
    
    with open(attr_file, 'rU') as fin:
        with open(norm_file, 'w') as fout:
            with open(check_file, 'w') as fout2:
                fin = csv.reader(fin, delimiter='\t')
                fout = csv.writer(fout, delimiter='\t')
                fout2 = csv.writer(fout2, delimiter='\t')
                
                age_i = 0
                age_unit_i = 0
                first = True
                
                for row in fin:
                
                    if first:
                        
                        # find indices of age and age_unit
                        age_i = row.index('age')
                        age_unit_i = row.index('age_unit')
                    
                        outRow = row + ['age_in_weeks']
                        print 'outRow', outRow
                        fout.writerow(outRow)
                        fout2.writerow(['sample', 'age_str', 'age_unit_str', 'age_in_weeks', 'age', 'age_unit'])
                        first = False
                        continue

                    age_in_weeks = ''
                    age_str = ''
                    age_unit_str = ''
                    
                    if row[age_i] and len(row[age_i]) > 0 and row[age_unit_i] and len(row[age_unit_i]) > 0:

                        if CODES:
                            age_unit_str = age_unit[int(row[age_unit_i])]
                            age_str = age[int(row[age_i])]
                        else:
                            age_unit_str = row[age_unit_i]
                            age_str = row[age_i]
                        
                        # estimate for those with a GW prefix
                        # TODO
                        
                        try:
                            age_float = float(age_str)
                            if age_unit_str == 'week' or age_unit_str == 'weeks':
                                age_in_weeks = age_float

                            elif age_unit_str == 'days':
                                age_in_weeks = age_float / 7

                            elif age_unit_str == 'year':
                                age_in_weeks = age_float * 52

                        except:
                            age_in_weeks = ''
                
                    outRow = row + [age_in_weeks]
                    fout.writerow(outRow)
                    
                    if row[0] == 'SRR2126029':
                        print 'age_in_weeks', '@', age_in_weeks, '@'
                        print 'age_in_weeks len', len(age_in_weeks)
                        print 'is string', isinstance(age_in_weeks, str)
                    
                    fout2.writerow([row[0], age_str, age_unit_str, age_in_weeks, row[age_i], row[age_unit_i]])

    print 'done'

    return 0

if __name__ == "__main__" :
    try:
        return_code = main(parse_args(sys.argv))
    except:
        traceback.print_exc()
        return_code = 1
    sys.exit(return_code)

