Source: Client
--------------
The client code is in javascript, css and html making use of Meteor in the
newer code, especially
its templates and session variables for maintaining state.

The original UI code was in the files, hexagram.js, hexagram.html and ahexagram.css.
As development continues, functionality should be pulled out of
these files and make use of Meteor to be more reactive and modular.

The new files are mostly named for their objects in the UI having
the same base name for
the javascript, html and css. Such as: navBar.js, navBar.html and navBar.css.

Throughout the code, the things called attributes on the UI are called 'layers'.

Javascript
^^^^^^^^^^

Below are special javascript files:

**mainHex.js** : first javascript file to execute under Meteor

**hexagram.js** : original code-base

**utils.js** : utilities used globally

HTML & CSS
^^^^^^^^^^

Below are special html and css files:

**main.html** : top of the html tree

**hexagram.html** : map page

**home.html** : home page

**grid.html** : methods page

**ahexagram.css** : named to make Meteor load it before other css files

**colorsFont.css** : global colors and fonts to make them easy to find and change

Libraries
^^^^^^^^^
Existing open-source libraries are leveraged as follows:

**color** : color library to handle gradients and conversion of color formats

**hexGlobals** : our meteor client code put here so it loads first

**jquery-ui** : UI utilities

**jstat** : stats library at one time used with web-workers, but not anymore

**select2** : jquery-ui plugin for the searchable drop-down selects
