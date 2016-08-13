/*
 * gChart.js 
 * For use of google charts
 */
var app = app || {}; // jshint ignore:line

(function (hex) { // jshint ignore:line
    //'use strict';

    function firstHistogram(layer_name, $histogramIn) {
 
        $histogram = $histogramIn;
        google.charts.load('current', {packages: ['corechart']});
        google.charts.setOnLoadCallback(function () {
            newHistogram(layer_name, $histogram);
        });
    }
 
    newHistogram = function (layer_name, $histogramIn) {
 
        // Create a div to hold the histogram
        var $histogram = $histogramIn ? $histogramIn : $("<div/>");
        $histogram.css({'width': '15em', 'height': '2em'});

        if (!google.visualization) {
            firstHistogram(layer_name, $histogram);
 
            // Return the container so it will be added to the DOM tree
            return $histogram;
        }
        return drawHistogram(layer_name, $histogram);
    }

    function drawHistogram(layer_name, $histogram) {
 
        with_layer(layer_name, function () {
            var layer = layers[layer_name],
                data,
                data1,
                options;
     
            data1 = _.zip(_.keys(layer.data), _.values(layer.data)),
            data = _.sortBy(data1, function(row){ return row[1]; }),
            data1 = [['Node', '']].concat(data),
            data = google.visualization.arrayToDataTable(data1),
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
            var chart = new google.visualization.Histogram($histogram[0]);
            chart.draw(data, options);
        });
        
        // Return the container so it will be added to the DOM tree
        return $histogram;
      }
})(app);
