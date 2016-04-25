
DATA_DIR = '' // Global data directory
URL_PORT = 0; // Global url port number

var url = Meteor.absoluteUrl();
URL_PORT = Number(url.slice(url.lastIndexOf(':') + 1, -1));

if (URL_PORT === 3000) {

    // Localhost development
    DATA_DIR = '/Users/swat/';
} else if (URL_PORT > 8080 && URL_PORT < 8443) {

    // Development on hexmap.sdsc.edu
    DATA_DIR = '/cluster/home/swat/';
} else {

    // Production
    DATA_DIR = '/data/';
}
