
// Global Environment
var rootUrl = 'http://localhost:3333';

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

exports.failed = function (expected, actual, line, filename, callerLine,
    callerFile, driver) {

    // Report a test failure.
    console.log('FAILED: EXPECTED: "' + expected + '"\n          ACTUAL: "' +
        actual + '"\n          (' + filename + ':' + line +
        (callerFile ? ' from ' + callerFile : '') +
        (callerLine ? ':' + callerLine : '') +
        ')');
    /*
    // It would be nice if we could quit this driver and not continue with
    // this particular test
    if (driver !== undefined) {
        driver.quit();
    }
    */
};

exports.verifyPromptModal = function (promptStr, textInputStr, driver,
        callerLine, callerFile) {
    
    // Verify a prompt modal exists and has the given prompt string
    // and input text string.
    var modalCss = '.promptModal',
        promptCss = modalCss + ' .modalLabel',
        textCss = modalCss + ' input';
    
    driver.findElements(By.css(modalCss))
        .then(function (els) {
            if (els.length < 1) {
                U.failed('prompt modal found', 'not found',
                         __line, __file, callerLine, callerFile, driver);
                return els;
            }
        })
        .then(_ => driver.findElement(By.css(promptCss)).getText())
        .then(function (text) {
             if (text !== promptStr) {
                U.failed(promptStr, text, __line, __file,
                    callerLine, callerFile, driver);
            }
        })
        .then(_ => driver.findElement(By.css(textCss))
            .getAttribute('value'))
        .then(function (val) {
            if (val !== textInputStr) {
                U.failed(textInputStr, val, __line, __file, callerLine,
                    callerFile, driver);
            }
        })
    ;
};

exports.verifyNewMapLoads = function (mapId, driver, url, callerLine, callerFile) {

    // Wait for a reload, then for the map selector to be found.
    var project = '#project .select2-container',
        projectSpan = project + ' > a > span';
    
    driver.wait(until.urlIs(url), 40000)
        .then(_ => driver.wait(until.elementLocated(By.css(project)),
            60000))
        .then(_ => driver.sleep(500)) // allow the select2 elements to load
        .then(_ => driver.findElement(By.css(projectSpan)).getText())
        .then(function (text) {
            if (text.indexOf(mapId) < 0) {
                U.failed(mapId, text, __line, __file, callerLine, callerFile,
                    driver);
            }
        })
    ;
};

/*
// does not work
exports.cancelModalWithClick = function (driver, callerLine, callerFile) {
 
    // Cancel and close a modal by clicking outside the modal.
    var outsideCss = '.ReactModal__Overlay';
    
    driver.sleep(1000)
        .then(_ => driver.findElement(By.css(outsideCss)).click())
    ;
};
*/

exports.clickDialogButton = function (driver, buttonPosition) {

    // Click on a dialog control button at the bottom of the jquery-ui dialog.
    // This assumes only one dialog is open and retrieves all
    // ui-dialog-buttonset.
    var pos = buttonPosition || 1;
    driver.findElement(By.css('.ui-dialog-buttonset button:nth-child('+pos+')'))
        .click();
};

exports.setUploadFile = function (path, anchor, dialogId, fileClass, driver) {
    var fileCss = '#' + dialogId + ' .' + anchor + ' .' + fileClass;
    
    driver.wait(until.elementLocated(By.id(dialogId)), 60000)
        .then(_ => driver.wait(until.elementLocated(By.css(fileCss)), 12000)
            .sendKeys(path));
};

exports.clickMenuOption = function (menuClass, menuOptionClass, driver) {

    // Click on a secondary navigation bar menu option.
    // This only works for the second level of options which are just under the
    // primary menu options always displayed on the navigation bar
    var menu = '#navBar .' + menuClass,
        menuOption = menu + ' .' + menuOptionClass;

    driver.wait(until.elementLocated(By.css(menu)), 6000).click()
        .then(_ => driver.sleep(1000)) // wait for the handler to be attached
        .then(_ => driver.wait(until.elementIsVisible(driver.findElement(
            By.css(menuOption))), 100).click())
    ;
};

exports.login = function (driver) {
    driver.wait(until.elementLocated(By.id('login-sign-in-link')), 6000).click()
        .then(_ => driver.wait(until.elementLocated(By.id('login-email')), 6000)
            .sendKeys(username))
        .then(_ => driver.findElement(By.id('login-password'))
            .sendKeys(password))
        .then(_ => driver.findElement(By.id('login-buttons-password')).click())
        .then(_ => driver.sleep(2000)); // Let the maps be found after login.
};

exports.setUp  = function (featurePath) {

    // Setup to run before each test.
    var driver = (new webdriver.Builder()
        .forBrowser('chrome')
        //.forBrowser('firefox')
        .build()
    );
    
    // Wait on everything for at least this long.
    driver.manage().timeouts().implicitlyWait(3000);
    return driver;
};


