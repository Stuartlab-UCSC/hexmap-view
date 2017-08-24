
// Global Environment
var rootUrl = 'http://localhost:3333';

var path = require('path');

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var username = 'swat@soe.ucsc.edu',
    password = 'Mollium123';

var _ = require('underscore');
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
        .then(_ => driver.findElement(By.css(range_values)).getAttribute('style'))
        .then(function (style) {
            if (style.indexOf('display: none')  > -1) {
                U.failed(
                    'shortlist range value should not have display:none',
                    'has display:none',
                     __line, __file, callerLine, callerFile, driver);
            }
        })
    
        // Verify the value of the low-range element.
        .then(_ => driver.findElement(By.css(range_low)).getText())
        .then(function (text) {
            if (text !== lowValue) {
                U.failed('shortlist low range of ' + lowValue, text,
                     __line, __file, callerLine, callerFile, driver);
            }
        })
        
        // Verify the value of the high-range element.
        .then(_ => driver.findElement(By.css(range_high)).getText())
        .then(function (text) {
            if (text !== highValue) {
                U.failed('shortlist low range of ' + highValue, text,
                     __line, __file, callerLine, callerFile, driver);
            }
        })
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
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
        })
    
        // Does the filter button have a cold filter src icon?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('src'))
        .then(function (src) {
            if (src !== rootUrl + '/icons/filter.png') {
                U.failed('shortlist filter button is cold', 'not cold',
                     __line, __file, callerLine, callerFile, driver);
            }
        })
    
        // Is the filter button visible?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('style'))
        .then(function (style) {
            if (style.indexOf('display: none')  > -1) {
                U.failed(
                    'shortlist filter button should not have display:none',
                    'has display:none',
                     __line, __file, callerLine, callerFile, driver);
            }
        })
    
        // Click the button.
        .then(_ => driver.findElement(By.css(filter)).click())
    
        // Does the filter button have a hot filter src icon?
        .then(_ => driver.findElement(By.css(filter)).getAttribute('src'))
        .then(function (src) {
            if (src !== rootUrl + '/icons/filter-hot.png') {
                U.failed('shortlist filter button is hot', 'not hot',
                     __line, __file, callerLine, callerFile, driver);
            }
        })
    ;
}

exports.verifyOneMetaData = function (klass, value, attrName, driver,
    callerLine, callerFile) {
    
    // Look for an entry, then check that it has the expected metadata.
    // This assumes the shortlist entry has already been found so we don't
    // need to wait for it to be found.
    var entryCss = '#shortlist div.shortlist_entry[data-layer="' + attrName+ '"]';
    var labelCss = entryCss + ' table.layer-metadata td.' + klass;
    var valueCss = labelCss + ' + td'; // the element after the label

    // Look for the shortlist entry.
    driver.findElement(By.css(entryCss))
        .then(_ => driver.findElements(By.css(labelCss)))
        .then(function (els) {
            if (els.length < 1) {
                U.failed('shortlist entry metadata label found for: ' +
                    klass, 'not found',
                    __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
        .then(_ => driver.findElements(By.css(valueCss)))
        .then(function (els) {
            if (els.length < 1) {
                U.failed('shortlist entry metadata value found for: ' +
                    klass, 'not found',
                    __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
        .then(_ => driver.findElement(By.css(valueCss)).getText())
        .then(function (actual) {
            if (actual !== value) {
                U.failed('shortlist entry metadata has value: ' + value +
                    ' for: ' + klass, 'has value: ' + actual,
                    __line, __file, callerLine, callerFile, driver);
                return actual;
            };
            return actual;
        })
        ;
}

exports.verifyOnlyTheseEntries = function (attrNames, driver, callerLine,
    callerFile) {
    
    console.log('verifyOnlyTheseEntries()');
    
    // Verify that only the entries with the names given exist.
    var entriesCss = '.shortlist_entry';
    
    driver.findElements(By.css(entriesCss))
        .then(function (els) {
            
            console.log('els.length:',  els.length);
                
            var notExpected = _.find(els, function (el) {
                var text = el.getText();
                
                console.log('text, attrNames:',  text, attrNames);
                
                return (attrNames.indexOf(text) < 0);
            });
            if (notExpected !== undefined) {
                U.failed('shortlist contains entries it should not',
                    'should only have: ' + attrNames,
                    __line, __file, callerLine, callerFile, driver);
            }
        })
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
    driver.wait(until.elementsLocated(By.css(entry)), 1000)
        .then(function (els) {
            if (els.length < 1) {
                U.failed('shortlist entry found', ' not found: ' + attrName,
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
            if (els.length > 1) {
                U.failed('one unique shortlist entry found',
                        'duplicate of ' + attrName + ' found',
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
    
        // Look for the meta label.
        .then(_ => driver.findElements(By.css(metaLabel)))
        .then(function (els) {
            if (els.length < 1) {
                U.failed('shortlist entry meta label found', 'not found',
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
        
        // Look for the chart svg.
        .then(_ => driver.wait(until.elementsLocated(By.css(svg)), 20000))
        .then(function (els) {
            if (els.length < 1) {
                console.log('els.length', els.length);
                U.failed('shortlist entry chart svg found', 'not found',
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
        
        // Click the entry to simulate hover over it.
        .then(_ => driver.findElement(By.css(entry)).click())
        
        // Look for primary hot image which means this is primary display attr.
        .then(_ => driver.findElements(By.css(hotPrimary)))
        .then(function (els) {
            if (els.length < 1) {
                U.failed('shortlist hot primary button found', 'not found',
                         __line, __file, callerLine, callerFile, driver);
                return els;
            };
            return els[0];
        })
    ;
}
