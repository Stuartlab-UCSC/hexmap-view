
// This tests the feature to select by node IDs.
// Also tested is the prompt modal and dynamic attribute naming modal.

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
var menuClass = 'selectMenu',
    menuOptionClass = 'nodeIdSelect',
    modalClass = 'nodeIdSelectModal',
    modalCss = '.' + modalClass,
    textareaCss = modalCss + ' textarea',
    buttonCss = modalCss + ' .modalButtons button',
    promptStr = 'Please name this new attribute',
    dupPromptSuffix = 'is in use, how about this one?',
    namerInputCss = '.promptModal input',
    namerButtonCss = '.promptModal .modalButtons button',
    useSuggestedName = 'useSuggestedName',
    suggestedName = 'Selection',
    //fileClass = 'readFile',
    startUrl = rootUrl + '/?p=unitTest/layoutBasicExp',
    endUrl = rootUrl + '/?',
    uploadRoot = testRoot + 'in/layout/';

function openModal (driver) {

    // Click the menu option to open the modal.
    var __function = arguments.callee.name;

    driver.get(startUrl)
        .then(_ => driver.wait(until.titleIs(title), 6000))
        .then(_ => U.clickMenuOption(menuClass, menuOptionClass, driver))
    ;
    return driver;
}

function addToTextarea (nodeIds, driver) {
    driver.wait(until.elementLocated(By.css(modalCss)), 60000)
        .then(_ => driver.wait(until.elementLocated(By.css(textareaCss)), 12000)
            .sendKeys(nodeIds));
    ;
}

function clickSelectButton (driver) {
    driver.findElement(By.css(buttonCss)).click();
}

function nameSelection (name, driver, useSuggestedName) {
    if (useSuggestedName) {
        driver.wait(until.elementLocated(By.css(namerButtonCss)), 6000).click()
        ;
    } else {
        driver.wait(until.elementLocated(By.css(namerInputCss)), 6000).clear()
            .then(_ => driver.findElement(By.css(namerInputCss)).sendKeys(name))
            .then(_ => driver.findElement(By.css(namerButtonCss)).click())
        ;
    }
}

function basicTest () {

    // Select one via textarea, taking the default attr name.
    var __function = arguments.callee.name,
        nodeIds = 'S1',
        name = 'Selection',
        metaDataClass = 'positives',
        positivesValue = '1',
        driver = U.setUp();
    
    openModal(driver)
        .then(_ => addToTextarea(nodeIds, driver))
        .then(_ => clickSelectButton(driver))
        .then(_ => U.verifyPromptModal(promptStr, name, driver, __line, __file))
        .then(_ => nameSelection(undefined, driver, true))
        .then(_ => SU.verifyNewEntry(name, driver, __line, __file))
        .then(_ => SU.verifyOneMetaData(metaDataClass, positivesValue, name,
            driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

function renameTest () {

    // Select one via textarea, using a custom attr name.
    var __function = arguments.callee.name,
        nodeIds = 'S1',
        name = 'OneAttibute of S1',
        metaDataClass = 'positives',
        positivesValue = '1',
        driver = U.setUp();
    
    openModal(driver)
        .then(_ => addToTextarea(nodeIds, driver))
        .then(_ => clickSelectButton(driver))
        .then(_ => nameSelection(name, driver))
        .then(_ => SU.verifyNewEntry(name, driver, __line, __file))
        .then(_ => SU.verifyOneMetaData(metaDataClass, positivesValue, name,
            driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());
    ;
}

/*
//Don't know how to abort a modal.
function abortNamerTest () {

    // Select one via textarea, using a custom attr name.
    var __function = arguments.callee.name,
        nodeIds = 'S1',
        name = 'Selection',
        metaDataClass = 'positives',
        positivesValue = '1',
        existingEntries = ['continuous_integer_w_dot']
        driver = U.setUp();
    
     openModal(driver)
        .then(_ => addToTextarea(nodeIds, driver))
        .then(_ => clickSelectButton(driver))
        .then(_ => U.verifyPromptModal(promptStr, name, driver, __line, __file))
    
        // Just to click outside of the prompt modal to cancel.
        .then(_ => U.cancelModalWithClick(driver, __line, __file))
 
        //.then(_ => SU.verifyOnlyTheseEntries(existingEntries,
        //    driver, __line, __file))

        //.then(_ => driver.sleep(3000))
        //.then(_ => driver.quit());
    ;
}
*/
function dupNameTest () {

    // Select one via textarea, using a duplicate attr name.
    var __function = arguments.callee.name,
        nodeIds = 'S1',
        name = 'continuous_integer_w_dot',
        name2 = 'a unique name',
        dupPromptStr = '"' + name + '" ' + dupPromptSuffix,
        suggestedName2 = name + ' 1',
        metaDataClass = 'positives',
        positivesValue = '1',
        driver = U.setUp();
    
    openModal(driver)
        .then(_ => addToTextarea(nodeIds, driver))
        .then(_ => clickSelectButton(driver))
        .then(_ => U.verifyPromptModal(promptStr, suggestedName,
            driver, __line, __file))
        .then(_ => nameSelection(name, driver))
        .then(_ => U.verifyPromptModal(dupPromptStr, suggestedName2,
            driver, __line,__file))
        .then(_ => nameSelection(name2, driver))
        .then(_ => SU.verifyNewEntry(name2, driver, __line, __file))
        .then(_ => SU.verifyOneMetaData(metaDataClass, positivesValue, name2,
            driver, __line, __file))
        .then(_ => driver.sleep(0))
        .then(_ => driver.quit());

    ;
}

basicTest();
renameTest();
dupNameTest();
