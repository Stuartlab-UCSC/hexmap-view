
var DEV = false;
///////////////

if (DEV) {
    var LISTEN_PORT = 8111,
        HTTPS_PORT = 8112;
} else {
    var LISTEN_PORT = 80,
        HTTPS_PORT = 443;
}

var http = require("http");
var target = "https://tumormap.ucsc.edu:".concat(HTTPS_PORT);
var server = http.createServer(function (req, res) {
    res.writeHead(301, {"Location": target.concat(req.url)});
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
console.log(timestamp(), 'http server starting on', LISTEN_PORT, 'forwarding to', target);
