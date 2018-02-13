
// Prompt.js
// The UI to prompt the user with a string and an optional text field.

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Modal from './Modal.js';
import utils from '/imports/common/utils.js';

class Prompt extends Component {
    constructor (props) {
        super(props);
        this.state = {};
        if (this.props.textStr) {
            this.state.textStr = this.props.textStr;
        }
        if (this.props.severity === 'error') {
            this.title = 'Error';
        }
        this.modalClass = 'promptModal';

        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }
    
    handleOpenModal() {
        
        // Set the text value here to force the cursor to the end.
        if (this.state.textStr) {
            this.$text.val(this.state.textStr).focus();
        }
    }

    handleCloseModal (response) {
        if (this.props.closeModal) {
            this.props.closeModal(response);
        }
    }
    
    handleButtonClick () {
        if (this.state.textStr) {
            this.handleCloseModal(this.state.textStr.trim());
        } else {
            this.handleCloseModal();
        }
    }
  
    handleTextKeyPress (event) {
    
        // Allow a return key press to trigger the button.
        if (event.which === 13 || event.keyCode === 13) {
            this.handleButtonClick();
        }
    }
    
    handleTextChange (event) {
        this.setState({ textStr: event.target.value });
    }
        
    render () {
        var self = this,
            input = null,
            button = null,
            link = null,
            linkText,
            labelClass = '';
        
        
        // Build the text box and buttons in the button box.
        if (typeof this.state.textStr !== 'undefined') {
            input =
                <input
                    type = 'text'
                    onKeyPress = {self.handleTextKeyPress}
                    onChange = {self.handleTextChange}
                    ref={(input) => { this.$text = $(input); }}
                />,
                button = <button onClick = {function () {
                    self.handleButtonClick();
                }}>
                    OK
                </button>;
        } else if (this.props.buttonInput) {
            input = this.props.buttonInput
        }
        
        if (this.props.linkText) {
            linkText = this.props.linkText;
        } else {
            linkText = this.props.link;
        }
        if (this.props.link) {
            link =
                <a
                    href = {this.props.link}
                    target = '_blank'
                >
                    {linkText}
                </a>;
        }
        
        if (this.props.labelClass !== undefined) {
            labelClass = this.props.labelClass;
        }
        
        return (
            <Modal
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {self.handleCloseModal}
                overlayClassName = 'prompt'
                className = {this.modalClass + ' ' + this.props.severity}
                parentSelector = {self.props.parentSelector}
                title = {this.title}
                body = {
                    <div>
                        <div
                            className = {'modalLabel ' + labelClass}
                        >
                            {this.props.promptStr}
                            {link}
                        </div>
                        {input}
                    </div>
                }
                buttons = {button}
            />
        );
    }
}
Prompt.propTypes = {

    // The text to display as a prompt.
    promptStr: PropTypes.string.isRequired,
    
    // A class to apply to the label.
    labelClass: PropTypes.string,
    
    // An http link to display just after the prompt string.
    link: PropTypes.string,
    
    // The text to display for the link.
    linkText: PropTypes.string,
    
    // The default text to display in the text input.
    textStr: PropTypes.string,

    // The type of prompt to control color and more.
    severity: PropTypes.oneOf(['info', 'warn', 'error']),
 
    // Function to call when this modal closes.
    closeModal: PropTypes.func,

    // Pass-thru to the React-modal to destroy the container.
    parentSelector: PropTypes.func,

    buttonInput: PropTypes.node,
};

Prompt.defaultProps = {
};
var containerId = 'prompt',
    callback;

function closeModal (response) {
    utils.destroyReactRoot(containerId);
    if (callback) {
    
        // Only allow string or undefined responses to be returned.
        if (_.isUndefined(response) || typeof response !== 'string') {
            callback();
        } else {
            callback(response);
        }
    }
}

function getParentSelector() {
    return document.querySelector('#' + containerId);
}

exports.show = function (promptStr, opts) {
    
    // Create and render this modal.
    // @param         promptStr: the prompt string
    // @param         opts.link: http link to appear after the prompt, optional
    // @param     opts.linkText: text to appear instead of actual link, optional
    // @param      opts.textStr: the text to put in the input box, optional
    // @param     opts.callback: function to call upon modal close, optional
    // @param     opts.severity: one of [error, info, warning], optional;
    // @param     opts.buttonInput: inserts a button into the prompt without 
    // @param    opts.labelClass: a class to apply to the prompt label, optional
    var container = utils.createReactRoot(containerId);
    callback = opts ? opts.callback : null;
    buttonInput = opts ? opts.buttonInput : null;
    
    render(
        <Prompt
            promptStr = {promptStr}
            className = 'prompt'
            labelClass = {opts.labelClass}
            textStr = {opts.textStr}
            link = {opts.link}
            linkText = {opts.linkText}
            parentSelector = {getParentSelector}
            severity = {opts.severity}
            closeModal = {closeModal}
            buttonInput = {buttonInput}
         />, container);
};
