
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

exports.verifyNewContinuousEntry = function (lowValue, highValue, attrName,
    driver, callerLine, callerFile) {
    
    // Verify a new continuous entry has continuous elements.
    // This assumes the entry has been clicked to simulate hover.
    var entry = '#shortlist div.shortlist_entry[data-layer="' + attrName+ '"]',
        range_values = entry + ' div.range_values',
        range_low = entry + ' div.range_low',
        range_high = entry + ' div.range_high';

    // Are the range values displayed?
    driver.findElements(By.css(range_values))
        .then(_ => driver.findElement(By.css(range_values)).getAttribute('style')
            .then(function (style) {
                if (style.indexOf('display: none')  > -1) {
                    U.failed(
                        'shortlist range value should not have display:none',
                        'has display:none',
                         __line, __file, callerLine, callerFile);
                }
            })
        )
    
        // Verify the value of the low-range element.
        .then(_ => driver.findElement(By.css(range_low)).getText()
            .then(function (text) {
                if (text !== lowValue) {
                    U.failed('shortlist low range of ' + lowValue, text,
                         __line, __file, callerLine, callerFile);
                }
            })
        )
        
        // Verify the value of the high-range element.
        .then(_ => driver.findElement(By.css(range_high)).getText()
            .then(function (text) {
                if (text !== highValue) {
                    U.failed('shortlist low range of ' + highValue, text,
                         __line, __file, callerLine, callerFile);
                }
            })
        )
    ;
    return driver; // to make .then's happy
}

exports.verifyColdFilter = function (attrName, driver, callerLine, callerFile) {

    // Verify a filter button is cold and exercise it.
    // This assumes the entry has been clicked to simulate hover.
    var entry = '#shortlist div.shortlist_entry[data-layer="' + attrName+ '"]',
        filter = entry + ' img.filter';
    
    // Find the cold filter button.
    driver.findElements(By.css(filter))
        .then(function (els) {
            
            // Does the filter button exist?
            if (els.length < 1) {
                U.failed('shortlist filter button found', 'not found',
                         __line, __file, callerLine, callerFile);
                return els;
            };
        })
    
        // Does the filter button have a cold filter src icon?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('src')
            .then(function (src) {
                if (src !== rootUrl + '/icons/filter.png') {
                    U.failed('shortlist filter button is cold', 'not cold',
                         __line, __file, callerLine, callerFile);
                }
            })
        )
    
        // Is the filter button visible?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('style')
            .then(function (style) {
                if (style.indexOf('display: none')  > -1) {
                    U.failed(
                        'shortlist filter button should not have display:none',
                        'has display:none',
                         __line, __file, callerLine, callerFile);
                }
            })
        )
    
        // Click the button.
        .then(_ => driver.findElement(By.css(filter)).click())
    
        // Does the filter button have a hot filter src icon?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('src')
            .then(function (src) {
                if (src !== rootUrl + '/icons/filter-hot.png') {
                    U.failed('shortlist filter button is hot', 'not hot',
                         __line, __file, callerLine, callerFile);
                }
            })
        )
    ;
}

exports.verifyNewEntry = function (attrName, driver, callerLine,
    callerFile) {
    
    // Look for an entry, then check that it has basic elements.
    var entry = '#shortlist div.shortlist_entry[data-layer="' + attrName+ '"]';
    var metaLabel = entry + ' table.layer-metadata td';
    var svg = entry + ' svg';
    var hotPrimary = entry + ' img.primary';

    // Look for the shortlist entry.
    driver.wait(function() {
        return driver.findElements(By.css(entry))
            .then(function (els) {
                if (els.length < 1) {
                    U.failed('shortlist entry found', ' not found: ' + attrName,
                             __line, __file, callerLine, callerFile);
                    return els;
                };
                if (els.length > 1) {
                    U.failed('one unique shortlist entry found',
                            'duplicate of ' + attrName + ' found',
                             __line, __file, callerLine, callerFile);
                    return els;
                };
                return els[0];
            });
    }, 1000)
    
        // Look for the meta label.
        .then(_ => driver.findElements(By.css(metaLabel))
            .then(function (els) {
                if (els.length < 1) {
                    U.failed('shortlist entry meta label found', 'not found',
                             __line, __file, callerLine, callerFile);
                    return els;
                };
                return els[0];
            })
        )
        
        // Look for the chart svg.
        .then(_ => driver.wait(function() {
            return driver.findElements(By.css(svg))
                .then(function (els) {
                    if (els.length < 1) {
                        console.log('els.length', els.length);
                        U.failed('shortlist entry chart svg found', 'not found',
                                 __line, __file, callerLine, callerFile);
                        return els;
                    };
                    return els[0];
                });
            }, 20000)
        )
        
        // Click the entry to simulate hover over it.
        .then(_ => driver.findElement(By.css(entry)).click()
        
            // Look for primary hot image which means this is primary display attr.
            .then(_ => driver.findElements(By.css(hotPrimary))
                .then(function (els) {
                    if (els.length < 1) {
                        U.failed('shortlist hot primary button found', 'not found',
                                 __line, __file, callerLine, callerFile);
                        return els;
                    };
                    return els[0];
                }))
            )
    ;
}


