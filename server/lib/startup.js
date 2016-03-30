
DATA_DIR = '' // a global variable

var url = Meteor.absoluteUrl();
var port = Number(url.slice(url.lastIndexOf(':') + 1, -1));

if (port === 3000) {

    // Localhost development
    DATA_DIR = '/Users/swat/';
} else if (port > 8080 && port < 8443) {

    // Development on hexmap.sdsc.edu
    DATA_DIR = '/cluster/home/swat/';
} else {

    // Production
    DATA_DIR = '/data/';
}
