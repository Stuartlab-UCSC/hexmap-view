/*
 * gChart.js 
 * For use of google charts
 */
var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';
 
    var load = new ReactiveVar('notLoaded'), // notLoaded, loading, loaded
        appReady = new ReactiveVar(false),
        chartQueue = [], // A queue of charts to draw
        charts = {}; // A chart handle for each layer used to free it

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
                    enableInteractivity: false,
                    hAxis: {
                        //gridlines: {color: 'transparent'},
                        ticks: [0],
                    },
                    histogram: { hideBucketItems: true, },
                    legend: { position: 'none' },
                    vAxis: {
                        gridlines: {color: 'transparent'},
                        textPosition: 'none',
                    },
                };
            charts[layer_name] = new google.visualization.Histogram(histogram)
                                    .draw(data, options);
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
 
    clear_google_chart = function (layer_name) {
        if (charts[layer_name]) {
            charts[layer_name].clearChart();
            delete charts[layer_name];
        }
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
        chartQueue.push({ layer_name: layer_name, histogram: histogram });
 
        // When google charts is loaded, draw those waiting to be drawn
        Tracker.autorun(function (comp) {
        
            if (load.get() === 'loaded' && appReady.get()) {
                comp.stop();
                _.each(chartQueue, function (chart) {
                    drawHistogram(chart.layer_name, chart.histogram);
                });
                chartQueue = undefined;
            }
        });
    }
 
    initGchart = function () {
        appReady.set(true);
    };
})(app);
