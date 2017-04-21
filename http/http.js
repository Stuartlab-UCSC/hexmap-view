
// http.js: server proxy to forward http requests to https.

var HEXMAP = process.env.HEXMAP
if (!HEXMAP || HEXMAP === '/cluster/home/swat/dev') {
    var LISTEN_PORT = 8221,
        HTTPS_PORT = 8222,
        TARGET = 'https://hexdev.sdsc.edu:' + HTTPS_PORT;
} else {
    var LISTEN_PORT = 80,
        HTTPS_PORT = 443,
        TARGET = 'https://tumormap.ucsc.edu:' + HTTPS_PORT;
}

var http = require("http");
var server = http.createServer(function (req, res) {
    res.writeHead(301, {"Location": TARGET.concat(req.url)});
    res.end();
});

function timestamp () {
    var now = new Date();
    return now.toString().slice(4, -15) + ':' + now.getMilliseconds()
}

// Listen for the `error` event. 
server.on('error', function (err, req, res) {
    console.log(Date.now(), 'http.js err', err);
    if (!res) {
        console.log(timestamp(), 'Error with http server and undefined "res"');
    } else {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });         
        res.end('Something went wrong with http:', err);
    }
});

server.listen(LISTEN_PORT);
console.log(timestamp(), 'http server starting on', LISTEN_PORT, 'forwarding to', TARGET);
