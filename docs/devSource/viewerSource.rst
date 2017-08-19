Source Code: View Server
========================

The code repository is at:

 https://github.com/ucscHexmap/hexagram

The most current code is in the dev branch.

The client code is making use of Meteor, while we migrate to lazy loading, react
and redux. The python computations are migrating to the compute server.

Note that hroughout much of the code, 'layers' refers to attributes.

Directory structure
-------------------

Below are descriptions of the major directories and files.:

**run-production** the start script for the production install

**bin** : secondary scripts to start servers

**config** : installation-specific configuration

**docs** : sources for this document, and other documents

**tests** : unit and integration tests for the view server

**www**

    | **client** : client-only javascript

        | **mainHex.js** : entry point for the client

        | **jquery-ui** : UI utilities

        | **select2** : jquery-ui plugin for the searchable drop-down selectors

        | **color-0.4.1.js** : color library to handle gradients and conversion of color formats

        | **htmlCss** : html and css files

            | **main.html** : top of the html tree

            | **hexagram.html** : map page

            | **home.html** : home page

            | **grid.html** : node density page

            | **ahexagram.css** : first css file to load

            | **colorsFont.css** : global colors and fonts

        | **lib** : third-party libraries

    | **imports** : client files loaded as needed

    | **lib** : server and client libraries

    | **server** : server-only nodejs and python initiated by the client

    | **public** : static files to be served, such as images

