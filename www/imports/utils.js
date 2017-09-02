
// Various utilities.

exports.unprintableAsciiCode = function (code, allowCR) {
    
    // Check for an unprintable ascii code given in decimal representation.
    // Valid codes:
    //      space - tilde (decimal code: 32-126)
    // @param code: ascii code in decimal representation
    // @param allowCR: also allow carriage return  (decimal code: 13)
    // @returns: true if there are any unprintables or false otherwise
    return !(
        (code >= 32 && code <= 126) ||
        (allowCR && code === 13)
    );
}

unprintableCharsInString = function (str) {

    // Check for unprintable chars in the given string.
    // Valid characters:
    //      space - tilde (hexadecimal: x20-x7e)
    // @param str: the string to be validated
    // @returns: true if there are any unprintables or false otherwise
    
    var pattern = /[^\x20-\x7e]/;
    return pattern.test(str);
}

exports.dropUnprintables = function (str) {

    // Drop any unprintable chars from the string.
    str.replace(/[^\x20-\x7e]/, '');
}

exports.allPrintableCharsInArray = function (data) {

    // Verify all characters are printable with the data given as an array
    // of arrays.
    // @param data the array to validate
    // @returns: true if all characters pass or false if any don't pass
    if (_.isUndefined(data)) {
        return false;
    }
    var unprintable = _.find(data, function (row) {
            return _.find(row, function (str) {
                return unprintableCharsInString(str);
            });
        });
    return (unprintable ? false : true);
}
