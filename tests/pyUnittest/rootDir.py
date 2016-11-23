
# rootDir.py
import os

# This assumes that this is executed from the test directory in which this
# file resides.

def getRootDir():
    pwd = os.getcwd() # ...hexagram/tests/pyUnittest
    return os.path.dirname(os.path.dirname(pwd)) + '/' # ...hexagram/
