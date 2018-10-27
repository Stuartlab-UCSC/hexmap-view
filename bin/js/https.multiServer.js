// https.js: Start the server proxy to handle ssl.

const httpProxy = require('http-proxy')
const fs = require('fs')
const http = require('http')
    

// Gather environment variables for testing via http.
const PROXY_PORT = process.env.HTTPS_PORT
const TARGET_TUMORMAP = 'http://localhost:3333'
const TARGET_CELL = 'http://localhost:3000'
const USING_HTTPS = process.env.USING_HTTPS

// Gather the rest needed for https:
const KEY = process.env.KEY
const CERT = process.env.CERT
const PATH_TO_CHAIN = process.env.CHAIN

let TARGET = TARGET_TUMORMAP

const target = null  // current target host

// Define options for httpProxy.createProxyServer.
let options = {
    target : TARGET,
    ws: true, // proxy websocket requests
    xfwd: true
}
if (USING_HTTPS) {
    options.ssl = {
        key: fs.readFileSync(KEY, 'utf8'),
        cert: fs.readFileSync(CERT, 'utf8'),
        ca : fs.readFileSync(PATH_TO_CHAIN, 'utf8')
    }
    options.secure = true // Do verify the certificate.
}

const timestamp = () => {

    // Returns a timestamp of the form: Jan 26 2017 11:20:48:295
    var now = new Date()
    return now.toString().slice(4, -15) + ':' + now.getMilliseconds()
}

onEvent = (text, severity) => {
    if (severity) {
        console.log(timestamp(), severity, ':', text)
    } else {
        console.log(timestamp(), 'Error: on', type,
            'event. Is the view server running at', TARGET, '?')
    }
}

// MAIN
const proxy = httpProxy
    .createProxyServer(options)
    .listen(PROXY_PORT)
onEvent('https proxy starting on ' + PROXY_PORT + ', targetting ' +
    TARGET, 'info')


proxy.on('proxyRes', function (proxyRes, req, res) {

    //
    //onEvent('RAW Response from target: connection:' +
    //  proxyRes.headers.connection, 'Info')
})

proxy.on('open', function (proxySocket) {
    
    // A message coming FROM the target.
    proxySocket.on('data', function (data) {
        //onEvent('proxy on opened', 'Info')
    })
})

proxy.on('close', function (res, socket, head) {

  // View server disconnected websocket connection.
  //onEvent('Client disconnected from websocket ' + socket, 'Info')
})

proxy.on('error', function (err, req, res) {
    onEvent('https.js error' + err, 'Error')
    res.writeHead(500, {  'Content-Type': 'text/plain' })
    res.end('Something went wrong with httpS: ' + err)
})
