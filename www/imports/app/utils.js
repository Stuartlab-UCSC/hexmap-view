
// Various utilities.
import { unmountComponentAtNode } from 'react-dom';

exports.unprintableAsciiCode = function (code, allowCR) {
    
    // Check for an unprintable ascii code given in decimal representation.
    // Valid codes:
    //      space - tilde (decimal code: 32-126)
    // @param code: ascii code in decimal representation
    // @param allowCR: also allow carriage return  (decimal code: 13)
    // @returns: true if there are any unprintables or false otherwise
    return !((code >= 32 && code <= 126) || (allowCR && code === 13));
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

exports.createReactRoot = function (containerId) {
    $('body').append($('<div id="' + containerId + '" />'));
    return document.querySelector('#' + containerId);
}

exports.destroyReactRoot = function (containerId) {
    var id = document.querySelector('#' + containerId);
    
    // The timeout prevents this error:
    // invariant.js:44 Uncaught Error:
    //      React DOM tree root should always have a node reference.
    // However the timeout also confuses any new react component of the same
    // class that is created before the timeout is up. Even if the second react
    // component has a different DOM container element.
    // Without the timeout we get the error, however the react component is
    // unmounted. Do this for now until we know how to create a new instance of
    // the same react component class.
    //setTimeout(function () {
        console.log('this message is OK for now: invariant.js:44 Uncaught Error: React DOM tree root should always have a node reference.');
        unmountComponentAtNode(id);
        $(id).remove();
    //});
}

exports.resizeMap = function () {

    // Set the initial map size and capture any resize window event so
    // the map gets resized too.
    var windowHt = $(window).height(),
        navHt = $('#navBar').height(),
        headerHt = $('#header').height();
    $('#mapContent').height(windowHt - navHt - headerHt - 1);
    $('#visualization').show();
}

function queryFreeReload () {
    Session.set('mapSnake', true);
    if (window.location.search.length > 0) {
        window.location.search = '';
    } else {
        window.location.reload();
    }
}

exports.pageReload = function (page) {
    Session.set('page', page);
    queryFreeReload();
}

exports.loadProject = function (project) {
    ctx.project = project;
    Session.set('page', 'mapPage');
    queryFreeReload();
}
