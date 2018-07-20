// https.js: Start the server proxy to handle ssl.

const httpProxy = require('http-proxy'),
    fs = require('fs');

// Gather environment variables.
const PROXY_PORT = process.env.HTTPS_PORT,
    KEY = process.env.KEY,
    CERT = process.env.CERT,
    PATH_TO_CHAIN = process.env.CHAIN,
    TARGET = process.env.METEOR_URL;

// Define options for httpProxy.createProxyServer.
var options = {
    ssl: {
        key: fs.readFileSync(KEY, 'utf8'),
        cert: fs.readFileSync(CERT, 'utf8'),
        ca : fs.readFileSync(PATH_TO_CHAIN, 'utf8')
    },
    target : TARGET,
    secure: false, // Depends on your needs, could be false.
    ws: true, // proxy websocket requests
    xfwd: true
};

var proxy = httpProxy.createProxyServer(options).listen(PROXY_PORT);
