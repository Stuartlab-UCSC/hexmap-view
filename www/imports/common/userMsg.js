
// userMsg.js
// This contains functions to display a message to the user.
// The convenience functions are probably the ones you want to use rather
// than show().

import React from 'react';
import { render } from 'react-dom';
import Prompt from '/imports/component/Prompt';
import utils from '/imports/common/utils';

var seq = 0,
    wrapPrefix = 'prompt',
    callback = {}; // a list of callbacks for all prompts

function closeHandler (wrapId, result) {

    // Destroy and free memory for this component.
    utils.destroyReactContainer(wrapId);
    
    // Let the caller know the result.
    if (callback[wrapId]) {
        callback[wrapId](result);
        delete callback[wrapId];
    }
}

exports.show = function (promptStr, opts) {

    // You probably want to use one of the convenience functions below to
    // display your prompt. However, this describes the options.
    // Create a Prompt instance which will be destroyed on close.
    // The only required parm is opts.promptStr.
    // @param         promptStr: the prompt string to show in the modal
    // @param     opts.severity: one of [error, info, warning], optional;
    //                           default is no color in prompt
    // @param         opts.link: http link to appear after the prompt, optional
    // @param     opts.linkText: text to appear instead of actual link, optional
    // @param opts.textInputStr: the text to put in the input box, optional
    // @param     opts.fadeAway: True means the modal fades after so many
    //                           seconds: default for info and warning is
    //                           true; default for other severities is false
    // @param opts.contentClass: a class to attach to the prompt content
    // @param opts.callback: function to call upon modal close, optional

    seq += 1;
    opts.wrapId = wrapPrefix + seq;
    if (opts.callback) {
        callback[opts.wrapId] = opts.callback;
        delete opts.callback;
    }
    opts.promptStr = promptStr;
    opts.isOpen = true;
    opts.closeHandler = closeHandler;
    appElement = utils.createReactRoot(opts.wrapId);

    var prompt = render(
        <Prompt
            promptStr = {promptStr}
            appElement = {appElement}
         />, appElement
    );

    // Set state to the options.
    prompt.setState(opts);
};


function adjustPromptStr (promptStr, prefix, suffix) {
    if (prefix) {
        promptStr = prefix + ' ' + promptStr;
    }
    if (suffix) {
        promptStr += ' ' + suffix;
    }
    return promptStr;
}

exports.info = function (promptStr, opts) {
    opts = opts || {};
    opts.severity = 'info';
    exports.show(promptStr, opts);
};

exports.warn = function (promptStr, opts) {
    opts = opts || {};
    opts.severity = 'warn';
    exports.show(promptStr, opts);
};

exports.error = function (promptStr, opts) {
    opts = opts || {};
    opts.severity = 'error';
    exports.show(promptStr, opts);
};

exports.jobSuccess = function (result, opts) {

    // Report a job success given a result from an http request.
    // @param  result: result object returned from the data server
    // @param  opts.prefix: text to prepend to the user message, optional
    // @param  opts.suffix: text to append to the user message, optional

    var promptStr = 'results: ';
    opts = opts || {};
    opts.link = result.url;
    opts.severity = 'info';
    opts.fadeAway = false;
    if (!opts.contentClass) {
        opts.contentClass = 'wider';
    }
    exports.show(adjustPromptStr(promptStr, opts.prefix, opts.suffix), opts);
};

exports.jobError = function (result, opts) {

    // Report a job error given an error result from an http request.
    // @param  result: result object returned from the data server
    // @param  opts.prefix: text to prepend to the user message, optional
    // @param  opts.suffix: text to append to the user message, optional
    // @param  opts.link: http link to appear after the prompt, optional
    // @param  opts.linkStr: text to appear instead of actual link, optional
    
    opts = opts || {};
    opts.severity = 'error';
    opts.logStr = (result.stackTrace) ?
        'Server Error ' + result.stackTrace : null,
    
    exports.show(adjustPromptStr(result.error, opts.prefix, opts.suffix), opts);
};

exports.jobSubmitted = function (opts) {
    // Report a job submitted.
    // @param  opts.prefix: text to prepend to the user message, optional
    // @param  opts.suffix: text to append to the user message, optional

    var promptStr = 'Request submitted. ' +
        'Results will return when complete.';
    opts = opts || {};
    opts.severity = 'info';
    
    exports.show(adjustPromptStr(promptStr, opts.prefix, opts.suffix), opts);
};
