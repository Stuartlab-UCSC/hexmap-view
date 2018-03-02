
// Decode a json string stored in mongo, then encode it.
// We decode and then incode to remove the escape characters monogodb inserts.

var mongoJson =
"{\"background\":\"white\",\"page\":\"mapPage\",\"pdfLegend\":false,\"pdfMap\":true,\"project\":\"WCDT/SampleMap/\",\"viewEdges\":false,\"reflectRanked\":false,\"active_layers\":[\"viper_supervised.c2_vs_otherClusters.AR\",\"viper_supervised.c2_vs_otherClusters.E2F1\"],\"center\":[13.3154296875,20.56640625],\"first_layer\":\"exp_NKX3-1\",\"gridZoom\":3,\"layoutIndex\":0,\"shortlist\":[\"viper_supervised.c2_vs_otherClusters.E2F1\",\"viper_supervised.c2_vs_otherClusters.AR\",\"viper_supervised.c2_vs_otherClusters.TP53\",\"exp_RB1\",\"viper_supervised.c2_vs_otherClusters.MYCN\",\"viper_supervised.c2_vs_otherClusters.EZH2\",\"viper_supervised.c2_vs_otherClusters.REST\",\"viper_supervised.c2_vs_otherClusters.SOX2\",\"viper_supervised.c2_vs_otherClusters.POU3F2\",\"ANY SMALL CELL VS. NOT SMALL CELL\",\"PURE SMALL CELL VS ADENO (INCLUDE IAC AS THIRD TYPE)\",\"PURE SMALL CELL VS. ADENO (EXCLUDE IAC)\"],\"zoom\":2,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.AR\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.POU3F2\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.SOX2\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.REST\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.EZH2\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.MYCN\":true,\"shortlist_filter_show_exp_RB1\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.TP53\":true,\"shortlist_filter_show_viper_supervised.c2_vs_otherClusters.E2F1\":true,\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.AR\":[-1.96305,1.54209],\"shortlist_filter_value_PURE SMALL CELL VS. ADENO (EXCLUDE IAC)\":0,\"shortlist_filter_value_PURE SMALL CELL VS ADENO (INCLUDE IAC AS THIRD TYPE)\":0,\"shortlist_filter_value_ANY SMALL CELL VS. NOT SMALL CELL\":0,\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.POU3F2\":[0.26528,3.24829],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.SOX2\":[0.07552,2.40081],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.REST\":[-0.56164,2.04635],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.EZH2\":[-0.70586,1.5294],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.MYCN\":[0.01631,1.36561],\"shortlist_filter_value_exp_RB1\":[12.6718,14.2377],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.TP53\":[-1.59684,1.54209],\"shortlist_filter_value_viper_supervised.c2_vs_otherClusters.E2F1\":[-0.96121,2.16762]}"
;
var decoded = JSON.parse(mongoJson);

console.log('json decoded:');
console.log(decoded);

var cleanJson = JSON.stringify(decoded);
console.log('clean json:');
console.log(cleanJson);
