const PROXY_PORT = 443;
const TARGET_PORT = 8443;

const DIR = '/data/home/hexmap/sec/';
const httpProxy = require('http-proxy'); 
const fs = require('fs');
const KEY = DIR + 'tumormap.key';
const CERT = DIR + 'tumormap.crt';
const PATH_TO_CHAIN = DIR + 'chain.crt';

var options = {
    ssl: {
        key: fs.readFileSync(KEY, 'utf8'),
        cert: fs.readFileSync(CERT, 'utf8'),
        ca : fs.readFileSync(PATH_TO_CHAIN, 'utf8')
    },
    target : "http://tumormap.ucsc.edu:" + TARGET_PORT,
    secure: true, // Depends on your needs, could be false.
    ws: true, // proxy websocket requests
    xfwd: true
};

try {
    var proxy = httpProxy.createProxyServer(options).listen(PROXY_PORT);
    
} catch (error) {
    console.log('https proxy could not start because hex server is not running:', TARGET_PORT);
    return;
}
console.log('https proxy starting on', PROXY_PORT, 'targetting', TARGET_PORT);


// Listen for the `error` event on `proxy`. 
try {
    proxy.on('error', function (err, req, res) {
        console.log('https.js err', err);
        try {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });         
            res.end('Something went wrong with httpS:', err);
        } catch (error) {
            console.log('https proxy failed on processing error event because hex server is not running:', TARGET_PORT);
        }
    });

} catch (error) {
    console.log('https proxy failed on "error" event because hex server is not running:', TARGET_PORT);
}


// Listen for the `proxyRes` event on `proxy`.
try {
    proxy.on('proxyRes', function (proxyRes, req, res) {
        try {
            //console.log('RAW Response from target: connection:', proxyRes.headers.connection);
        } catch (error) {
            console.log('https proxy failed on processing proxyRes event because hex server is not running:', TARGET_PORT);
        }
    });

} catch (error) {
    console.log('https proxy failed on "proxyRes" event because hex server is not running:', TARGET_PORT);
}


// Listen for the `open` event on `proxy`.
try {
    proxy.on('open', function (proxySocket) {
        try {
            // listen for messages coming FROM the target here
            proxySocket.on('data', function (data) {
                //console.log('proxy on open');
            });
            
        } catch (error) {
            console.log('https proxy failed on processing open event because hex server is not running:', TARGET_PORT);
        }
    });
    
} catch (error) {
    console.log('https proxy failed on "open" event because hex server is not running:', TARGET_PORT);
}


// Listen for the `close` event on `proxy`.
try {
    proxy.on('close', function (res, socket, head) {
        try {
            // view disconnected websocket connections
            //console.log('proxy on close (client disconnected)');
            
        } catch (error) {
            console.log('https proxy failed on processing close event because hex server is not running:', TARGET_PORT);
        }
        
    });
    
} catch (error) {
    console.log('https proxy failed on "close" event because hex server is not running:', TARGET_PORT);
}
