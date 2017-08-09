
var path = require('path');

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var username = 'swat@soe.ucsc.edu',
    password = 'Mollium123';

var U = require('./testUtils');
var __file = path.basename(__filename);

// Define these so we can display the test file line number with failures.
Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});
Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});

exports.failed = function (expected, actual, line, filename, callerLine, callerFile) {

    // Report a test failure.
    console.log('FAILED: EXPECTED: "' + expected + '"\n          ACTUAL: "' +
        actual + '"\n          (' + filename + ':' + line +
        (callerFile ? ' from ' + callerFile : '') +
        (callerLine ? ':' + callerLine : '') +
        ')');
};

exports.verifyNewMapLoads = function (mapId, driver, url, callerLine, callerFile) {

    // Wait for a reload, then for the map selector to be found.
    thisEndUrl = url || defaultEndUrl
    
    driver.wait(until.urlIs(thisEndUrl), 20000)
        .then(_ => driver.sleep(500))
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.id('s2id_project'))), 60000))
        .then(_ => driver.findElement(By.css('#s2id_project span'))
            .getText()).then(function (text) {
                if (text.indexOf(mapId) < 0) {
                    U.failed(mapId, text, __line, __file, callerLine, callerFile);
                }
            });
};

exports.clickDialogButton = function (driver, buttonPosition) {

    // Click on a dialog control button at the bottom of the dialog.
    // This assumes only one dialog is open and retrieves all
    // ui-dialog-buttonset.
    var pos = buttonPosition || 1;
    driver.findElement(By.css('.ui-dialog-buttonset button:nth-child('+pos+')'))
        .click();
};

exports.clickMenuOption = function (menuClass, menuOptionClass, driver) {

    // Click on a secondary navigation bar menu option.
    // This only works for the second level of options which are just under the
    // primary menu options always displayed on the navigation bar
    driver.wait(until.elementLocated(By.css('#navBar .' + menuClass)), 6000)
            .click()
        .then(_ => driver.sleep(100)) // to avoid dialog not opening occasionally
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css('#navBar .' + menuOptionClass))), 12000).click())
        .then(_ => driver.sleep(100));  // to avoid dialog not opening occasionally
};

exports.login = function (driver) {
    driver.wait(until.elementLocated(By.id('login-sign-in-link')), 6000).click()
        .then(_ => driver.wait(until.elementLocated(By.id('login-email')), 6000)
            .sendKeys(username))
        .then(_ => driver.findElement(By.id('login-password'))
            .sendKeys(password))
        .then(_ => driver.findElement(By.id('login-buttons-password')).click())
        .then(_ => driver.sleep(500)); // Let the maps be found after login.
};

exports.setUp  = function (featurePath) {

    // Setup to run before each test.
    return (new webdriver.Builder()
        .forBrowser('chrome')
        //.forBrowser('firefox')
        .build()
    );
};


