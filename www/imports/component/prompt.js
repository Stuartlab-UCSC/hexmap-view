
// prompt.js
// The UI to prompt the user with a string and an optional text field.

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Modal from './modal.js';
import Utils from '../common/utils.js';

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
            button = null;
        
        // Build the text box and buttons in the button box.
        if (this.state.textStr) {
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
                            className = 'modalLabel'>
                            {this.props.promptStr}
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
    
    // The default text to display in the optional text input.
    textStr: PropTypes.string,
    
    // The type of prompt to control color and more.
    severity: PropTypes.oneOf(['info', 'warn', 'error']),
 
    // Function to call when this modal closes.
    closeModal: PropTypes.func,

    // Pass-thru to the React-modal to destroy the container.
    parentSelector: PropTypes.func,
};

Prompt.defaultProps = {
};
var containerId = 'prompt',
    callback;

function closeModal (response) {
    Utils.destroyReactRoot(containerId);
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
    // @param      opts.textStr: the text to put in the input box, optional
    // @param     opts.callback: function to call upon modal close, optional
    // @param     opts.severity: one of [error, info, warning], optional
    var container = Utils.createReactRoot(containerId);
    callback = opts ? opts.callback : null;
    render(
        <Prompt
            promptStr = {promptStr}
            textStr = {opts.textStr}
            parentSelector = {getParentSelector}
            severity = {opts.severity}
            closeModal = {closeModal}
         />, container);
};
