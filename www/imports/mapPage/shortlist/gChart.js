/*
* gChart.js 
* For use of google charts
*/
import Colormap from '/imports/mapPage/color/Colormap';
import Layer from '/imports/mapPage/longlist/Layer';

var load = new ReactiveVar('notLoaded'), // notLoaded, loading, loaded
    appReady = new ReactiveVar(false),
    chartQueue = [], // A queue of charts to draw
    charts = {}; // A chart handle for each layer used to free it

function drawBarChart (layer_name, container) {

    Layer.with_one(layer_name, function () {
            
        // Find counts of each category
        var counts = [];
        _.each(_.values(layers[layer_name].data), function(cat) {
            if (counts[cat]) {
                counts[cat] += 1;
            } else {
                counts[cat] = 1;
            }
        });

        // Fill any undefined array values with zero
        var filled = [];
        for (var i = 0; i < counts.length; i += 1) {
            filled[i] = (counts[i]) ? counts[i] : 0;
        }
        
        // Find the colors from the colormap or the default binary colors
        var colormap = colormaps[layer_name],
            colors;
        if (!colormap || Object.keys(colormap).length === 0) {
            colors = [Colormap.binaryOffColor(), Colormap.binaryOnColor()];
        } else {
            colors = _.map(colormap, function (cat) {
                return cat.color.hexString();
            });
        }
        
        // Format the data as google chart wants
        var arrays = _.map(filled, function (count, i) {
            return [i.toString(), count, colors[i]];
        });
    
        // If there is no data, there is no chart to draw
        if (arrays.length < 1) {
            return;
        }
        
        // Add the headers to the top of the data
        var withHeaders =
            [['Category', 'Count', { role: 'style' }]].concat(arrays);
               
        var data = google.visualization.arrayToDataTable(withHeaders);

        var options = {
            backgroundColor: 'transparent',
            chartArea: {
                bottom: 5,
                left: 0,
                right: 0,
                top: 0,
            },
            enableInteractivity: false,
            legend: { position: 'none' },
            vAxis: {
                gridlines: {color: 'transparent'},
                textPosition: 'none',
            },
        };
        charts[layer_name] =
            new google.visualization.ColumnChart(container).draw(data, options);
    });
}

function drawHistogram (layer_name, container) {

    Layer.with_one(layer_name, function () {
        var layer = layers[layer_name],
            arrays = _.zip(_.keys(layer.data), _.values(layer.data)),
            withHeaders = [['Node', '']].concat(arrays),
            data = google.visualization.arrayToDataTable(withHeaders),
            options = {
                backgroundColor: 'transparent',
                bar: { gap: 0 },
                chartArea: {
                    bottom: 5,
                    left: 0,
                    right: 0,
                    top: 0,
                },
                colors: ['#555555'],
                enableInteractivity: false,
                hAxis: {
                    ticks: [0],
                },
                histogram: { hideBucketItems: true, },
                legend: { position: 'none' },
                vAxis: {
                    gridlines: {color: 'transparent'},
                    textPosition: 'none',
                },
            };
        
        // If there is no data, there is no chart to draw
        if (arrays.length < 1) {
            return;
        }

        charts[layer_name] =
            new google.visualization.Histogram(container).draw(data, options);
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

exports.clear = function (layer_name) {
    if (charts[layer_name]) {
        charts[layer_name].clearChart();
        delete charts[layer_name];
    }
};

exports.create = function (layer_name, $container, type) {

    var status = load.get(),
        container = $container[0];

    // If google charts is loaded, just draw it
    if (status ==='loaded') {
        if (type === 'histogram') {
            drawHistogram(layer_name, container);
        } else {
            drawBarChart(layer_name, container);
        }
        return;

    // If google charts has not yet been asked to load, then load it
    } else if (status === 'notLoaded') {
        loadGoogleCharts();
    }

    // Save the chart data to be drawn after google charts is loaded
    chartQueue.push({
        layer_name: layer_name,
        container: container,
        type: type,
    });

    // After google charts is loaded, draw those waiting to be drawn
    Tracker.autorun(function (comp) {
    
        if (load.get() === 'loaded' && appReady.get()) {
            comp.stop();
            _.each(chartQueue, function (chart) {
                if (chart.type === 'histogram') {
                    drawHistogram(chart.layer_name, chart.container);
                   
                } else { // Assume bar chart
                    drawBarChart(chart.layer_name, chart.container);
                }
            });
            chartQueue = undefined;
        }
    });
};

exports.init = function () {
    appReady.set(true);
};
