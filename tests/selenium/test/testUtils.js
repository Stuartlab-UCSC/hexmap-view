
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

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

function clickMenuOption (menuClass, optionClass, driver) {
    var navBar = driver.findElement(By.id('navBar')),
        menuOption = navBar.findElement(By.className(optionClass));
    
    navBar.findElement(By.className(menuClass)).click();
    driver.wait(until.elementIsVisible(menuOption), 6000);
    menuOption.click();
    driver.sleep(100);
}

function signIn (username, password, driver) {
    driver.wait(until.elementLocated(By.id('login-sign-in-link')), 6000);
    driver.findElement(By.id('login-sign-in-link')).click();
    driver.wait(until.elementLocated(By.id('login-email')), 6000);
    driver.findElement(By.id('login-email')).sendKeys(username);
    driver.findElement(By.id('login-password')).sendKeys(password);
    driver.findElement(By.id('login-buttons-password')).click();
    driver.sleep(500);
}

function goToUrl (url, driver) {
    driver.get(url);
    driver.wait(until.titleIs('UCSC Tumor Map'), 6000);
}

exports.setUpForMenu = function (opt) {
    goToUrl(opt.url, opt.driver);
    if (opt.username) {
        signIn(opt.username, opt.password, opt.driver);
    }
    clickMenuOption(opt.menuClass, opt.menuOptionClass, opt.driver);
}

exports.failed = function () {

    // Assuming the first argument is the line number and the rest are one or
    // more message parts to be concatenated with one space between each.
    var line = arguments[0],
        filename = arguments[1],
        msg = arguments[2];
    for (var i = 3; i < arguments.length; i++) {
        msg += ' ' + arguments[i];
    }
    console.log('FAILED:', msg, '(' + filename + ':' + arguments[0] + ')');
}
