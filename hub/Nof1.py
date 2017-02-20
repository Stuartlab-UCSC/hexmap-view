
# This is a stub for testing the call to the calc script
def viaHub(opts):

    #rc = main(opt)
    rc = 0
    
    # An error return
    # TODO is this how we want to return errors?
    # TODO error should contain captured errors as well as stack traces
    if rc == 1:
    
        return {
            'code': 1,
            'error': error
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
