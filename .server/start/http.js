var http = require("http");
const LISTEN_PORT = 8111;
const HTTPS_PORT = 8343

var target = "https://tumormap.ucsc.edu:".concat(HTTPS_PORT)
var server = http.createServer(function (req, res) {
    res.writeHead(301, {"Location": target});
    res.end();
});

// Listen for the `error` event. 
server.on('error', function (err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });         
    res.end('Something went wrong with http:', err);
});

server.listen(LISTEN_PORT);
console.log('http server started on', LISTEN_PORT, 'forwarding to', target);

