
// perform.js
// Capture performance metrics.

const PERFORM = false; // eslint-disable-line
// Coding area to track where:
//      null = initialization
//      render = polyon rendering
let AREA = 'render'
let header = false; // true = log header
var startTime = 1706190000000;

exports.log = function (msg, area=null, reset=false) {
    if (!PERFORM) { return; }
    if (area != AREA) { return; }

    if (reset) { startTime = Date.now()}
    var now = Date.now();
    console.log(now - startTime + ',' +  msg);
};

exports.init = function (area=null) {
    if (!PERFORM) { return; }
    console.log('init:area:', area)
    if (area != AREA) { return; }

    var date = new Date().toString();
    startTime = Date.now();
    exports.log('0-init:begin');

    var meta = {
        date: date.slice(4, (date.indexOf('GMT') - 4)),
        dev: DEV,
        appVersion: '"' + navigator.appVersion + '"',
        userAgent: '"' + navigator.userAgent + '"',
        platform: navigator.platform,
        language: navigator.language,
    };
    
    if (header) {
        // Output each metadata piece.
        _.each(meta, function(val, key) {
            console.log(key + ',' + val);
        });
    }
};
