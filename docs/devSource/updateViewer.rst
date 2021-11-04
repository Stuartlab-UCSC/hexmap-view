Update View Server code on Production
=====================================

This assumes you already have a view server installed in a development
environment and on the production machine.

In the development environment build the bundle and copy it to the production
machine::

 cd $HEXMAP
 bin/deployWww
 
Ignore warnings about "color.js". It will be resolved at run-time.

If any of the files in bin or config have been updated, copy those over mauallyBUNDLE
from your dev machine to their respective directories on production.

On the production machine install the bundle while logged in as user 'hexmap'::

 cd $HEXMAP
 bin/installWww

Then stop and start the view server so it will use the new code.

