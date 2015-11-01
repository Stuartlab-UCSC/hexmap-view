// mutualInfo.js
// This contains the logic for retrieving the mutual information stats

var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    tsvParseRows = function (tsv_data) {

        // Even though the retrieved file has no new line or carriage return,
        // the browser inserts '\n\r' at the end of the file. So, remove any
        // trailing new line and carriage return so that we don't end up with
        // an extra empty row.

        if (tsv_data.lastIndexOf('\n') === tsv_data.length - 1) {
            tsv_data = tsv_data.slice(0, -1);
        }

        // Remove any trailing microslop carriage return
        if (tsv_data.lastIndexOf('\r') === tsv_data.length - 1) {
            tsv_data = tsv_data.slice(0, -1);
        }
        return $.tsv.parseRows(tsv_data);
    }
})(app);

