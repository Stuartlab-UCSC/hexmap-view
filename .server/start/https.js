const httpProxy = require('http-proxy'); 
const fs = require('fs');
const PROXY_PORT = 8343
const TARGET_PORT = 8300
const DIR = '/data/home/hexmap/sec/'
const KEY = DIR + 'tumormap.key';
const CERT = DIR + 'tumormap.crt';
//const PATH_TO_CHAIN = DIR + 'chain.crt';

var options = {
    ssl: {
        key: fs.readFileSync(KEY, 'utf8'),
        cert: fs.readFileSync(CERT, 'utf8'),
        //ca : fs.readFileSync(PATH_TO_CHAIN, 'utf8'),
    },
    target : "http://tumormap.ucsc.edu:" + TARGET_PORT,
    secure: true, // Depends on your needs, could be false.
    ws: true, // proxy websocket requests
    xfwd: true
};

var proxy = httpProxy.createProxyServer(options).listen(PROXY_PORT);
console.log('https proxy started on', PROXY_PORT, 'targetting', TARGET_PORT);

// Listen for the `error` event on `proxy`. 
proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });         
    res.end('Something went wrong with httpS:', err);
});
              
// Listen for the `proxyRes` event on `proxy`.  
proxy.on('proxyRes', function (proxyRes, req, res) {
//    console.log('RAW Response from target: connection:', proxyRes.headers.connection);
});                
 
// Listen for the `open` event on `proxy`.  
proxy.on('open', function (proxySocket) {

    // listen for messages coming FROM the target here 
    proxySocket.on('data', function (data) {
//        console.log('proxy on open');
    });
    //proxySocket.on('data', hybiParseAndLogMessage);

});                     
 
// Listen for the `close` event on `proxy`. 
proxy.on('close', function (res, socket, head) {

    // view disconnected websocket connections 
//    console.log('proxy on close (client disconnected)');
});

