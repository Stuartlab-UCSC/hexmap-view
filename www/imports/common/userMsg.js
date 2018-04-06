
// userMsg.js
// This contains functions to display a message to the user.
// The convenience functions are probably the ones you want to use rather
// than show().

import React from 'react';
import { render } from 'react-dom';
import Notify from '/imports/component/Notify';
import '/imports/component/notify.css';

var userMsgList,
    TIME = 10000,  // milliseconds before message fades away
    key = 0; // the identifier for a message in the message list.

exports.show = function (msg, opts) {

    // Create a user message.
    // You probably want to use one of the convenience functions below to
    // display your message. However, this describes the options.
    // The only required parm is opts.msg.
    // @param msg: text to replace the usual message, optional; either a string
    //             or an array of strings, one per paragraph
    // @param opts.severity: one of [error, info, warn], optional;
    //                       default is info
    // @param opts.link: http link to appear after the message, optional
    // @param opts.linkText: text to appear instead of actual link, optional
    // @param opts.callback: function to call upon modal close, optional
    key += 1;
    opts = opts || {},
    opts.key = key;
    opts.msg = msg;
    
    // Only info and warning messages without links automatically disappear.
    if (opts.link || opts.severity === 'error') {
        opts.time = 0;
    } else {
        opts.time = TIME;
    }

    let state = {};
    state[key] = opts;
    userMsgList.setState(state);
    
    // Log a console message if requested or if it's an error.
    if (opts.logStr) {
        console.log(opts.logStr);
        delete opts.logStr;
    } else if (opts.severity === 'error') {
        console.error('trace for user error message:', msg, ':');
    }
};

exports.info = function (msg, opts) {

    // Show an informational message.
    // See exports.show() for parameter descriptions.
    opts = opts || {};
    opts.severity = 'info';
    exports.show(msg, opts);
};

exports.warn = function (msg, opts) {

    // Show a warning message.
    // See exports.show() for parameter descriptions.
    opts = opts || {};
    opts.severity = 'warn';
    exports.show(msg, opts);
};

exports.error = function (msg, opts) {

    // Show an error message.
    // See exports.show() for parameter descriptions.
    opts = opts || {};
    opts.severity = 'error';
    exports.show(msg, opts);
};

exports.jobSubmitted = function (msg, opts) {

    // Report a job submitted.
    // @param msg: text of the message; optional; omit to use standard message;
    //             either a string or an array of strings, one per paragraph
    // See exports.show() for opts descriptions.
    opts = opts || {};
    opts.severity = 'info';
    if (!msg) {
        msg = [
            'Request submitted.',
            'Results will return when complete.',
        ];
    }
    exports.show(msg, opts);
};

exports.jobSuccess = function (result, msg, opts) {

    // Report a job success given a result from an http request.
    // @param result: result object returned from the data server
    // See exports.show() for other parameter descriptions.
    opts = opts || {};
    opts.severity = 'info';
    opts.link = result.url;
    exports.show(msg, opts);
};

exports.jobError = function (result, msg, opts) {

    // Report a job error given an error result from an http request.
    // @param result: result object returned from the data server
    // @param msg: text to prepend to the result.error string, optional,
    //             either a string or an array of strings, one per paragraph
    // See exports.show() for opts descriptions.
    opts = opts || {};
    opts.severity = 'error';
    opts.link = result.url;
    opts.logStr = (result.stackTrace) ?
        'Server Error ' + result.stackTrace : null;
    
    // Transform any string into an array.
    if (!msg) {
        msg = [];
    } else if (typeof msg === 'string') {
        msg = [msg];
    }
    msg.push(result.error);
    exports.show(msg, opts);
};

exports.init = function () {

    // Create user message list.
    userMsgList = render(
        <Notify>
        </Notify>, document.querySelector('#userMsgListWrap'));
};


