
// perform.js
// Capture performance metrics.

PERFORM = true; // eslint-disable-line
var header = false; // true = log header

var startTime = 1506190000000;
exports.log = function (msg) {
    if (!PERFORM) { return; }
    
    var now = Date.now();
    console.log(now - startTime + ',' +  msg);
};

exports.init = function () {
    if (!PERFORM) { return; }

    var date = new Date().toString();
    startTime = Date.now();
    exports.log('0-init:begin');

    var meta = {
        date: date.slice(4, (date.indexOf('GMT') - 4)),
        viewDir: VIEW_DIR,
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
