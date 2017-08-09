
// Environment-dependent values.
var rootUrl = 'http://localhost:3333/';
    startUrl = rootUrl + '?p=ynewton.gliomas-paper',
    endUrl = 'http://localhost:3333/?';

var $ = require('jquery');
var path = require('path');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var U = require('./testUtils');

var __file = path.basename(__filename);

function pOfynewtonGliomasPaperTest () {

    // Test this url to display the proper map

        var __function = arguments.callee.name,
            driver = U.setUp();
        var url = rootUrl + '?p=ynewton.gliomas-paper',
            map = 'Gliomas';
    
    driver.get(url)
        .then(_ => U.verifyNewMapLoads(map, driver, url, __line, __file))
        .then(_ => driver.quit());
}

pOfynewtonGliomasPaperTest();
