
// Environment-dependent values.
var startUrl = 'http://localhost:3333/?p=unitTest/layoutBasicExp',
    endUrl = 'http://localhost:3333/?',
    beginMapId = 'unitTest/layoutBasicExp',
    mapId1 = 'swat_soe.ucsc.edu/map';

var $ = require('jquery');
var path = require('path');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var util = require('./testUtils');

var filename = path.basename(__filename),
    menuClass = 'fileMenu',
    menuOptionClass = 'createMap';

function setup (featurePath) {

    // Setup to run before each test.
    var driver = new webdriver.Builder()
        .forBrowser('chrome')
        //.forBrowser('firefox')
        .build();

    util.setUpForMenu({
        url: startUrl,
        menuClass: menuClass,
        menuOptionClass: menuOptionClass,
        driver: driver,
        username: 'swat@soe.ucsc.edu',
        password: 'Mollium123',
    });
    
    // Assuming this is the only ui-dialog
    var dialog = driver.findElement(By.className('ui-dialog'));
    
    // Set the feature file path.
    // TODO wait for upload-file element to be found
    dialog.findElement(By.className('feature_upload_anchor'))
        .findElement(By.className('upload-file'))
        .sendKeys(featurePath);
    
    return {driver: driver, dialog: dialog};
}

function tearDown (driver) {
    driver.quit();
}

function failed (msg, line, driver) {
    util.failed(line, filename, 'mapId1:', mapId1, 'not found.');
    teardown(driver);
}

function clickCreateButton (driver) {

    // Press on the Create button to create the map.
    // No Selenium nor jquery calls used here because they only closed the
    // dialog on click() and did not call the registered click handler.
    driver.executeScript(
        "var buttons = document.getElementsByTagName('button');" +
        "var button = _.filter(buttons, function (button) {" +
        "    if (button.innerText.indexOf('Create') === 0) { return true };" +
        "});" +
        "button[0].click();"
    );
}

function reloadPage (driver) {

    // Wait for a reload, then for the map selector to be found.
    driver.wait(until.urlIs(endUrl), 10000);
    driver.wait(until.elementLocated(By.css('div#s2id_project span')), 6000);
}

function basicTest () {

    // Most basic create map.
    var featurePath = '/Users/swat/dev/compute/tests/in/layout/full_matrix.tab',
        s = setup(featurePath),
        driver = s.driver,
        dialog = s.dialog;
    
    clickCreateButton(driver);
    reloadPage(driver);

    // Verify the proper map is loaded.
    driver.findElement(By.css('div#s2id_project span'))
        .getText().then(function(text) {
            if (text.indexOf(mapId1) < 1) {
                failed('mapId1: ' + mapId1 + ' not found.', __line, driver);
            } else {
                // TODO: check log before checking proper map loaded?
                driver.quit();
            }
        }
    );
}

basicTest();


