
// This tests adding an attribute via the Edit menu add attribute.

// Global Environment
var rootUrl = 'http://localhost:3333',
    testRoot = '/Users/swat/dev/compute/tests/',
    title = 'UCSC Tumor Map';

// Standard for all tests
var $ = require('jquery'),
    path = require('path');
    webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until,
    U = require('./testUtils'),
    __file = path.basename(__filename);

var SU = require('./shortlistUtils');

// Locals
var menuClass = 'editMenu',
    menuOptionClass = 'attrAdd',
    dialogId = 'attrAddDialog',
    fileClass = 'readFile',
    startUrl = rootUrl + '/?p=unitTest/layoutBasicExp',
    endUrl = rootUrl + '/?',
    uploadRoot = testRoot + 'in/layout/';

function addToShortlist (filePath, attrName, driver) {

    // Click the menu option, upload the file
    var __function = arguments.callee.name;

    driver.get(startUrl)
        .then(_ => driver.wait(until.titleIs(title), 6000))
        .then(_ => U.clickMenuOption(menuClass, menuOptionClass, driver))
        .then(_ => U.setUploadFile(filePath, 'fileAnchor', dialogId,
            fileClass, driver))
    ;
    return driver;
}

function continuousTest () {

    // Basic continuous attribute test
   var __function = arguments.callee.name,
        filePath = uploadRoot + 'continuous_float.tab',
        attrName = 'continuous_float 1',
        lowValue = '2.6e-1',
        highValue = '2.4e+1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(SU.verifyNewContinuousEntry(lowValue, highValue,
                    attrName, driver,  __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function categoricalTest () {

    // Basic categorical attribute test
   var __function = arguments.callee.name,
        filePath = uploadRoot + '3_categories.tab',
        attrName = '3_categories 1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function binaryNoColormapTest () {

    // Basic binary attribute test with no colormap.
   var __function = arguments.callee.name,
        filePath = uploadRoot + '1-0.tab',
        attrName = '1/0 1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function binaryWithColormapTest () {

    // Basic binary attribute test with that uses a colormap.
   var __function = arguments.callee.name,
        filePath = uploadRoot + 'true-No.tab',
        attrName = 'true/No 1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function continuousReloadTest () {

    // Test reload of continuous attribute.
    var __function = arguments.callee.name,
        filePath = uploadRoot + 'continuous_float.tab',
        attrName = 'continuous_float 1',
        lowValue = '2.6e-1',
        highValue = '2.4e+1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => driver.get(rootUrl))
        .then(_ => driver.sleep(1000)) // give the state a chance to save
        .then(_ => driver.wait(until.titleIs(title), 6000))
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(SU.verifyNewContinuousEntry(lowValue, highValue,
                    attrName, driver,  __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function categoricalReloadTest () {

    // Test reload of categorical attribute.
   var __function = arguments.callee.name,
        filePath = uploadRoot + '3_categories.tab',
        attrName = '3_categories 1',
        driver = U.setUp();

    addToShortlist(filePath, attrName, driver)
        .then(_ => driver.get(rootUrl))
        .then(_ => driver.sleep(1000)) // give the state a chance to save
        .then(_ => driver.wait(until.titleIs(title), 6000))
        .then(_ => SU.verifyNewEntry(attrName, driver, __line, __file))
        .then(_ => SU.verifyColdFilter(attrName, driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

continuousTest();
categoricalTest();
binaryNoColormapTest();
binaryWithColormapTest();
continuousReloadTest();
categoricalReloadTest();
