
// Environment-dependent values.
var startUrl = 'http://localhost:3333/?p=unitTest/layoutBasicExp',
    majorMap = 'swat_soe.ucsc.edu',
    minorMap = 'map',
    uploadRoot = '/Users/swat/dev/compute/tests/in/layout/',
    featurePrefix = '/Users/swat/data/featureSpace/' + majorMap + '/',
    featureRoot = featurePrefix + minorMap + '/',
    viewPrefix = '/Users/swat/data/view/' + majorMap + '/',
    viewRoot = viewPrefix + minorMap + '/',
    endUrl = 'http://localhost:3333/?';

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
        basicTest:            '--layoutInputFile,' + featureRoot   +                   'full_matrix.tab,--layoutInputFormat,clusterData,--layoutName,layout,--outputDirectory,'      + viewRoot + ',--noLayoutIndependentStats,--noLayoutAwareStats',
        mapNameTest:          '--layoutInputFile,' + featurePrefix +       'mapNameTest/full_matrix.tab,--layoutInputFormat,clusterData,--layoutName,layout,--outputDirectory,' + viewPrefix + 'mapNameTest/,--noLayoutIndependentStats,--noLayoutAwareStats',
        /* TODO untested. adjust featureRoot -> featurePrefix and viewRoot -> viewPrefix
        fullSimilarityTest:   '--layoutInputFile,' + featureRoot   +               'simularity_full.tab,--layoutInputFormat,fullSimilarity,--layoutName,layout,--outputDirectory,'   + viewRoot + ',--noLayoutIndependentStats,--noLayoutAwareStats',
        sparseSimilarityTest: '--layoutInputFile,' + featureRoot   +                    'simularity.tab,--layoutInputFormat,sparseSimilarity,--layoutName,layout,--outputDirectory,' + viewRoot + ',--noLayoutIndependentStats,--noLayoutAwareStats',
        xyPositionsTest:      '--layoutInputFile,' + featureRoot   +                   'coordinates.tab,--layoutInputFormat,xyPositions,--layoutName,layout,--outputDirectory,'      + viewRoot + ',--noLayoutIndependentStats,--noLayoutAwareStats',
        attributeFirstTest:   '--layoutInputFile,' + featureRoot   +                   'attributeFirstTest/full_matrix.tab,--layoutInputFormat,clusterData,--layoutName,layout,--outputDirectory,'      + viewRoot + ',--colorAttributeFile,' + featureRoot + 'attributes.tab,--firstAttribute,continuous_integer,--noLayoutIndependentStats,--noLayoutAwareStats',
        */
        attributeFileTest:    '--layoutInputFile,' + featurePrefix + 'attributeFileTest/full_matrix.tab,--layoutInputFormat,clusterData,--layoutName,layout,--outputDirectory,' + viewPrefix + 'attributeFileTest/,--colorAttributeFile,' + featurePrefix + 'attributeFileTest/attributes.tab,--noLayoutIndependentStats,--noLayoutAwareStats',
        
    };

function failed (expected, actual, line) {
    U.failed(expected, actual, line, path.basename(__filename));
}

function verifyParametersProduced (testName, driver) {
    driver.findElement(By.css('#create_map_dialog .log')).getAttribute('value')
        .then(function (text) {
            var index = text.indexOf(preOptsText);
            if (index > -1) {
                var actual = text.substring(index + preOptsText.length);
                if (actual !== expOpts[testName]) {
                    failed(expOpts[testName], actual, __line);
                }
            }
        });
}

var verifyNewMapLoads = function (mapId, driver) {

    // Wait for a reload, then for the map selector to be found.
    driver.wait(until.urlIs(endUrl), 20000)
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

function setUploadFile (path, anchor, driver) {
    driver.wait(until.elementIsVisible(driver.findElement(
            By.id('create_map_dialog'))), 60000)
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css('#create_map_dialog .' + anchor + ' .upload-file'))),
            6000).sendKeys(path));
}

function doThroughSetFeatureFile (featurePath, driver) {

    // Log in, click createMap menu option and set the feature file.
    driver.wait(until.titleIs('UCSC Tumor Map'), 6000)
        .then(_ => U.login(driver))
        .then(_ => U.clickMenuOption(menuClass, menuOptionClass, driver))
        .then(_ => setUploadFile(featurePath, 'feature_upload_anchor', driver));
}

function setMapName (name, driver) {
    let selector = '#create_map_dialog .minor_project';

    // changing the visible text, but ui.get('project_minor') doesn't reflect it:
    driver.findElement(By.css(selector)).clear();
    driver.findElement(By.css(selector)).sendKeys(name + '\n');
}

function setFormat (format, driver) {

    // TODO how to set a select2 ?
    driver.findElement(By.css('#create_map_dialog .format_anchor')).click();
}

function setAdvancedOptions (driver) {

    // Toggle the advanced options visibility, whatever it is.
    driver.findElement(By.css('#create_map_dialog .advanced_trigger')).click();
}

/*
// TODO untested
function setFirstAttribute (first, driver) {
    driver.wait(until.elementIsVisible(driver.findElement(
            By.id('create_map_dialog'))), 60000)
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css('#create_map_dialog .default_attribute'))),
            6000).sendKeys(first));
}
*/

function basicTest () {

    // Layout parameters tested:
    // --layoutInputFile is feature data
    // --layoutInputFormat is feature data
    // --layoutName
    // --outputDirectory
    // --noLayoutIndependentStats
    // --noLayoutAwareStats

    var __function = arguments.callee.name,
        featurePath = uploadRoot + 'full_matrix.tab';
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => verifyParametersProduced (__function, driver))
        .then(_ => verifyNewMapLoads(majorMap + '/map', driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}

function mapNameTest () {

    // Additional layout parameters tested:
    // advanced options display
    // --outputDirectory

    var __function = arguments.callee.name,
        featurePath = uploadRoot + 'full_matrix.tab',
        attributePath = uploadRoot + 'attributes.tab',
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => setMapName(__function, driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => verifyParametersProduced (__function, driver))
        .then(_ => verifyNewMapLoads(majorMap + '/' + __function, driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}

/*
// TODO untested
function fullSimTest () {

    // Additional layout parameters tested:
    // --layoutInputFile is full similarity
    // --layoutInputFormat is full similarity
    // TODO: verify format declared matches the file's format for all formats.

    var __function = arguments.callee.name,
        featurePath = uploadRoot + 'similarity_full.tab';
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => setFormat('fullSimilarity', driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => verifyParametersProduced (__function, driver))
        .then(_ => verifyNewMapLoads(majorMap + '/' + __function, driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}
*/

function attributeFileTest () {

    // Additional layout parameters tested:
    // --attributeFile

    var __function = arguments.callee.name,
        featurePath = uploadRoot + 'full_matrix.tab',
        attributePath = uploadRoot + 'attributes.tab',
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => setMapName(__function, driver))
        .then(_ => setUploadFile(attributePath, 'attribute_upload_anchor', driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => verifyParametersProduced (__function, driver))
        .then(_ => verifyNewMapLoads(majorMap + '/' + __function, driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}

/* TODO untested
function attributeFirstTest () {

    // Additional layout parameters tested:
    // advanced options display
    // --firstAttribute some attribute

    var __function = arguments.callee.name,
        featurePath = uploadRoot + 'full_matrix.tab',
        attributePath = uploadRoot + 'attributes.tab',
        driver = U.setUp();
    
    driver.get(startUrl)
        .then(_ => doThroughSetFeatureFile(featurePath, driver))
        .then(_ => setUploadFile(attributePath, 'attribute_upload_anchor', driver))
        .then(_ => U.clickDialogButton(driver))
        .then(_ => setAdvancedOptions(driver))
        .then(_ => setFirstAttribute('continuous_integer', driver))
        .then(_ => verifyParametersProduced (__function, driver))
        .then(_ => verifyNewMapLoads(majorMap + '/' + __function, driver))
        //.then(_ => driver.sleep(3000))
        .then(_ => driver.quit());
}
*/

basicTest();
mapNameTest();

//fullSimilarityTest(); TODO untested, how to set a select2 ?

// TODO unimplemented, how to set a select2 ?:
//sparseSimilarityTest();
//xyPositionsTest();

attributeFileTest();

// Advanced UI options
//attributeFirstTest(); TODO untested, disabled in UI

// TODO unimplemented, how to set a select2 ?:
//zeroSparseSimilarityTest();
//zeroXyPositionsTest();
//zeroFullSimilarityTest();
//zeroClusterDataTest();

//statsTest(); TODO unimplemented, disabled in UI


/*
TODO: future
- with zero-replace
    - greyed out for full sim
    - greyed out for feature data
- create button:
    - greyed out after pressed
    - createMap snake visible
*/

