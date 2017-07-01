
// Environment-dependent values.
var startUrl = 'http://localhost:3333/?p=unitTest/layoutBasicExp',
    majorMap = 'swat_soe.ucsc.edu',
    minorMap = 'map',
    uploadRoot = '/Users/swat/dev/compute/tests/in/layout/',
    featureRoot = '/Users/swat/data/featureSpace/' + majorMap + '/' + minorMap + '/',
    viewRoot = '/Users/swat/data/view/' + majorMap + '/' + minorMap + '/',
    endUrl = 'http://localhost:3333/?',
    mapId1 = majorMap + '/' + minorMap ;

var $ = require('jquery');
var path = require('path');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var U = require('./testUtils');

var menuClass = 'fileMenu',
    menuOptionClass = 'createMap',
    preOptsText = 'Compute request options: ',
    expOpts = {
        basicTest: '--layoutInputFile,' + featureRoot + 'full_matrix.tab,--layoutInputFormat,clusterData,--layoutName,layout,--directory,' + viewRoot + ',--include-singletons,--noLayoutIndependentStats,--noLayoutAwareStats',
    };

function failed (expected, actual, line) {
    U.failed(expected, actual, line, path.basename(__filename));
}

function verifyParametersProduced (testName) {
    driver.findElement(By.css('#create_map_dialog .log')).getAttribute('value')
        .then(function (text) {
            var preOptsIndex = text.indexOf(preOptsText);
            if (preOptsIndex > -1) {
                var actual = text.substring(preOptsIndex + preOptsText.length);
                if (actual !== expOpts[testName]) {
                    failed(expOpts[testName], actual, __line);
                }
            }
        });
}

function setFeatureFile (featurePath, driver) {
    driver.wait(until.elementIsVisible(driver.findElement(
            By.id('create_map_dialog'))), 60000)
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css('#create_map_dialog .upload-file'))), 6000)
            .sendKeys(featurePath));
}

var verifyNewMapLoads = function (mapId, driver) {

    // Wait for a reload, then for the map selector to be found.
    driver.wait(until.urlIs(endUrl), 20000)
        .then(_ => driver.sleep(500))
        .then(_ => driver.wait(until.elementLocated(
            By.id('s2id_project')), 6000))
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.id('s2id_project'))), 60000))
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css('#s2id_project span')), 6000))
            .getText().then(function (text) {
                if (text.indexOf(mapId1) < 0) {
                    failed(mapId1, text, __line);
                }
            }));
}

function doThroughSetFeatureFile (featurePath, driver) {

    // Log in, click createMap menu option and set the feature file.
    driver.wait(until.titleIs('UCSC Tumor Map'), 6000)
        .then(_ => U.login(driver))
        .then(_ => U.clickMenuOption(menuClass, menuOptionClass, driver))
        .then(_ => setFeatureFile(featurePath, driver));
}

function basicTest () {
    /*
    layout parameters tested:
        --layoutInputFile = feature data
        --layoutInputFormat = feature data
        --layoutName
        --directory
        --include-singletons
        --noLayoutIndependentStats
        --noLayoutAwareStats
    */
    var featurePath = uploadRoot + 'full_matrix.tab';
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => verifyParametersProduced (arguments.callee.name))
        //.then(_ => verifyNewMapLoads(mapId1, driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}

basicTest();

/*
Combinations:
- full similarity
- sparse similarity
- coordinates
- include-singletons ?
- with attributes
    - with first attribute
- with precomputed stats (unhide temporarily)
- with zero-replace
    - sparse sim: with zero-replace
    - coordinates: with zero-replace
    - greyed out for full sim
    - greyed out for feature data
- future: create button:
    - greyed out after pressed
    - createMap snake visible
*/

