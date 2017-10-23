
// https.js: server proxy to handle ssl.

var HEXMAP = process.env.HEXMAP,
    PROXY_PORT = process.env.HTTPS_PORT,
    TARGET_PORT = process.env.PORT, // meteor server port
    SECDIR = '/data/certs/',
    SERVER_BASE_URL,
    TARGET,
    KEY,
    CERT;
    
if (HEXMAP = '/data') {
    SERVER_BASE_URL = 'tumormap.ucsc.edu';
    KEY = SECDIR + 'tumormap.key';
    CERT = SECDIR + 'tumormap.crt';
} else {
    SERVER_BASE_URL = 'hexdev.sdsc.edu';
    KEY = SECDIR + 'hexdev.key';
    CERT = SECDIR + 'hexdev.crt';
}
TARGET = 'HTTP://' + SERVER_BASE_URL + ':' + TARGET_PORT,

const httpProxy = require('http-proxy');
const fs = require('fs');
const PATH_TO_CHAIN = SECDIR + 'chain.crt';

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

function timestamp () {

    // This returns a timestamp of the form: Jan 26 2017 11:20:48:295
    var now = new Date();
    return now.toString().slice(4, -15) + ':' + now.getMilliseconds()
}

try {
    var proxy = httpProxy.createProxyServer(options).listen(PROXY_PORT);
    
} catch (error) {
    console.log(timestamp(), 'https proxy could not start because view server is not running:', TARGET_PORT);
    return;
}
console.log(timestamp(), 'https proxy starting on', PROXY_PORT, 'targetting', TARGET_PORT);


// Listen for the `error` event on `proxy`. 
try {
    proxy.on('error', function (err, req, res) {
        try {
            console.log(timestamp(), 'error: https.js err', err);
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });         
            res.end('Something went wrong with httpS:', err);
        } catch (error) {
            console.log(timestamp(), 'error: on processing error event because view server is not running:', TARGET_PORT);
        }
    });

} catch (error) {
    console.log(timestamp(), 'https proxy failed on "error" event because view server is not running:', TARGET_PORT);
}


// Listen for the `proxyRes` event on `proxy`.
try {
    proxy.on('proxyRes', function (proxyRes, req, res) {
        try {
            //console.log(timestamp(), 'info: RAW Response from target: connection:', proxyRes.headers.connection);
        } catch (error) {
            console.log(timestamp(), 'error: on processing proxyRes event because view server is not running:', TARGET_PORT);
        }
    });

} catch (error) {
    console.log(timestamp(), 'error: on "proxyRes" event because view server is not running:', TARGET_PORT);
}


// Listen for the `open` event on `proxy`.
try {
    proxy.on('open', function (proxySocket) {
        try {
            // listen for messages coming FROM the target here
            proxySocket.on('data', function (data) {
                //console.log(timestamp(), 'info: proxy on open');
            });
            
        } catch (error) {
            console.log(timestamp(), 'error: on processing open event because view server is not running:', TARGET_PORT);
        }
    });
    
} catch (error) {
    console.log(timestamp(), 'error: on "open" event because view server is not running:', TARGET_PORT);
}


// Listen for the `close` event on `proxy`.
try {
    proxy.on('close', function (res, socket, head) {
        try {
            // view disconnected websocket connections
            //console.log(timestamp(), 'info: proxy close event (client disconnected)');
            
        } catch (error) {
            console.log(timestamp(), 'error: on processing close event because view server is not running:', TARGET_PORT);
        }
        
    });
    
} catch (error) {
    console.log(timestamp(), 'error: on "close" event because view server is not running:', TARGET_PORT);
}
