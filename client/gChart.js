/*
 * gChart.js 
 * For use of google charts
 */
var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    var load = new ReactiveVar('notLoaded'), // notLoaded, loading, loaded
        charts = [];

    function drawHistogram(layer_name, histogram) {
 
        with_layer(layer_name, function () {
            var layer = layers[layer_name],
                arrays = _.zip(_.keys(layer.data), _.values(layer.data)),
                //sorted = _.sortBy(arrays, function(row){ return row[1]; }),
                withHeaders = [['Node', '']].concat(arrays),
                data = google.visualization.arrayToDataTable(withHeaders),
                options = {
                    backgroundColor: 'transparent',
                    bar: { gap: 0 },
                    chartArea: {
                        backgroundColor: 'transparent',
                        bottom: 5,
                        left: 0,
                        right: 0,
                        top: 0,
                    },
                    hAxis: {gridlines: {color: 'transparent'}},
                    legend: { position: 'none' },
                    vAxis: {
                        gridlines: {color: 'transparent'},
                        textPosition: 'none',
                    },
                };
            new google.visualization.Histogram(histogram).draw(data, options);
        });
    }

    function loadGoogleCharts() {
 
        // Load google charts on the first chart drawn
        load.set('loading');
        google.charts.load('current', {packages: ['corechart']});
        google.charts.setOnLoadCallback(function () {
            load.set('loaded');
        });
    }
 
    newHistogram = function (layer_name, $histogram) {
 
        var status = load.get(),
            histogram = $histogram[0];

        // If google charts is loaded, just draw it
        if (status ==='loaded') {
            drawHistogram(layer_name, histogram);
            return;

        // If google charts has not yet been asked to load, then load it
        } else if (status === 'notLoaded') {
            loadGoogleCharts();
        }

        // Save the chart data to be drawn after google charts is loaded
        charts.push({ layer_name: layer_name, histogram: histogram });
 
        // When google charts is loaded, draw those waiting to be drawn
        Tracker.autorun(function (comp) {
        
            if (load.get() === 'loaded') {
                comp.stop();
                _.each(charts, function (chart) {
                    drawHistogram(chart.layer_name, chart.histogram);
                });
            }
        });
    }
})(app);
