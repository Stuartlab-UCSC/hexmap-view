// http.js: server proxy to forward http requests to https.
const http = require("http");

const TARGET = process.env.URL_BASE,
    LISTEN_PORT = process.env.HTTP_PORT;

function timestamp () {

    // This returns a timestamp of the form: Jan 26 2017 11:20:48:295
    var now = new Date();
    return now.toString().slice(4, -15) + ':' + now.getMilliseconds()
}

var server = http.createServer(function (req, res) {
    res.writeHead(301, {"Location": TARGET.concat(req.url)});
    res.end();
}).listen(LISTEN_PORT);

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

console.log(timestamp(), 'http server starting on', LISTEN_PORT, 'forwarding to', TARGET);
