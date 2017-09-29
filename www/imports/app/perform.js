
// perform.js
// Capture performance metrics.

var startTime = 1506190000000;
exports.log = function (msg) {
    if (!PERFORM) { return; }
    
    var now = Date.now();
    console.log(now - startTime + ',' +  msg);
}

exports.init = function () {
    if (!PERFORM) { return; }

    var date = new Date().toString()
    startTime = Date.now();
    var meta = {
        date: date.slice(4, (date.indexOf('GMT') - 4)),
        viewDir: VIEW_DIR,
        dev: DEV,
        appVersion: '"' + navigator.appVersion + '"',
        userAgent: '"' + navigator.userAgent + '"',
        platform: navigator.platform,
        language: navigator.language,
    };
    
    // Output each metadata piece.
    _.each(meta, function(val, key) {
        console.log(key + ',' + val);
    });
    exports.log('perform init');
}
