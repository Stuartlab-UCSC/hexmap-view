
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var username = 'swat@soe.ucsc.edu',
    password = 'Mollium123';

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

exports.failed = function (expected, actual, line, filename) {

    // Report a test failure.
    console.log('FAILED: EXPECTED: "' + expected + '"\n          ACTUAL: "' +
        actual + '"\n          (' + filename + ':' + line + ')');
};

exports.setUp  = function (featurePath) {

    // Setup to run before each test.
    return (new webdriver.Builder()
        .forBrowser('chrome')
        //.forBrowser('firefox')
        .build()
    );
};


