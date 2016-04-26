const LISTEN_PORT = 80;
const HTTPS_PORT = 443;

var http = require("http");
var target = "https://tumormap.ucsc.edu:".concat(HTTPS_PORT);
var server = http.createServer(function (req, res) {
    res.writeHead(301, {"Location": target.concat(req.url)});
    res.end();
});

// Listen for the `error` event. 
server.on('error', function (err, req, res) {
    console.log('http.js err', err);
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });         
    res.end('Something went wrong with http:', err);
});

server.listen(LISTEN_PORT);
console.log('http server starting on', LISTEN_PORT, 'forwarding to', target);
