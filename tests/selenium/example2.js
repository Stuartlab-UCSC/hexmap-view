var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

webdriver.promise.USE_PROMISE_MANAGER = false;

[0,1,2].map(async (i) => {
  var driver = await new webdriver.Builder().forBrowser('chrome').build();
  await driver.manage().window().setSize(600, 400);
  await driver.manage().window().setPosition(300 * i, 400 * i);
  await driver.get('http://www.google.com');
  await driver.findElement(By.name('q')).sendKeys('webdriver');
  await driver.findElement(By.name('btnG')).click();
  await driver.wait(until.titleIs('webdriver - Google-haku'), 1000);
  await driver.quit();
})
