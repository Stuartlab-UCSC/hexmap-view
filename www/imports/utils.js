
// Various utilities.

function unprintableCharsInString (str, allowNLCR) {

    // Check for unprintable chars in the given string.
    // Valid characters:
    //      space - tilde or decimal: 32-126 or hexadecimal: x20-x7e
    // @param allowNLCR: allow new line and carriage return chars as well
    // @returns: true if there are any unprintables or false otherwise
    
    // original: /[^\x20-\x7e]/g,
    var pattern = /[^\x20-\x7e]/;
    if (allowNLCR) {
        pattern = /[^\x20-\x7e\r\n]/;
        //pattern = /[^\x20-\x7e\r\n]/g;
    }
    return pattern.test(str);
}

exports.removeCarriageReturns = function (str) {

    // Remove evil carriage return characters from a string.
    // @param str: the string to search
    // @returns: the carriage-return-free string
    
    return str.replace(/\r/g, '');
}

exports.allPrintableCharsInString = function(str, allowNLCR) {

    // Verify all characters are printable in the given string.
    // @param allowNLCR: allow new line and carriage return chars as well
    // @returns: true if all characters pass or false if any don't pass
    return !unprintableCharsInString(str, allowNLCR);
}

exports.allPrintableCharsInArray = function (data, allowNLCR) {

    // Verify all characters are printable with the data given as an array
    // of arrays.
    // @param allowNLCR: allow new line and carriage return chars as well
    // @returns: true if all characters pass or false if any don't pass
    if (_.isUndefined(data)) {
        return false;
    }
    var unprintable = _.find(data, function (row) {
            return _.find(row, function (str) {
                return unprintableCharsInString(str, allowNLCR);
            });
        });
    return (unprintable ? false : true);
}
