Update View Server code on Production
=====================================

This assumes you already have a view server installed in a development
environment and on the production machine.

In the development environment build the bundle and copy it to the production
machine::

 cd $HEXMAP
 bin/deployWww
 
Ignore warnings about "color.js". It will be resolved at run-time.

On the production machine install the bundle::

 cd $HEXMAP
 bin/installWww

Then stop and start the view server so it will use the new code.

