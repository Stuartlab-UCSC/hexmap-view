
// http.js: server proxy to forward http requests to https.
TARGET = process.env.ROOT_URL;
LISTEN_PORT = process.env.HTTP_PORT;

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
