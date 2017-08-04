
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

function failed (expected, actual, line) {
    U.failed(expected, actual, line, path.basename(__filename));
}

/*
var verifyNewMapLoads = function (mapId, driver, thisEndUrl) {

    // Wait for a reload, then for the map selector to be found.
    thisEndUrl = thisEndUrl || defaultEndUrl
    
    driver.wait(until.urlIs(thisEndUrl), 20000)
        .then(_ => driver.sleep(500))
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.id('s2id_project'))), 60000))
        .then(_ => driver.findElement(By.css('#s2id_project span'))
            .getText()).then(function (text) {
                if (text.indexOf(mapId) < 0) {
                    failed(mapId, text, __line);
                }
            });
}
*/
function pOfynewtonGliomasPaperTest () {

    // Test this url to display the proper map

        var __function = arguments.callee.name,
            driver = U.setUp();
        var url = rootUrl + '?p=ynewton.gliomas-paper',
            map = 'Gliomas';
    
    driver.get(url)
        .then(_ => verifyNewMapLoads(map, driver, url))
        .then(_ => driver.quit());
}

pOfynewtonGliomasPaperTest();
