
# NOTE: This is just a stub for testing the call to the calc script.
# The real call will be in the calc script file.

def whateverRoutine(opts):

    if opts[
    #result = main(opts) # The implementation goes here
    result = 0
    
    # An error return
    if rc == 1:
        return {
            'error': 'Some error message or stack trace'
        }

    # A successful return
    return {
       'mySample1': {
           'x': 42,
           'y': 36,
           'neighbors': {
               'node1': 0.352,
               'node2': 0.742,
           },
       },
       'mySample2': {
           'x': 42,
           'y': 36,
           'neighbors': {
               'node1': 0.275,
               'node2': 0.965,
           },
       }
    }
