
// prompt.js
// The UI to prompt the user with a string and an optional text field.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import Modal from './modal.js';
import './css/reactModal.css';

class Prompt extends Component {
    constructor (props) {
        super(props);
        this.state = {};
        if (this.props.textStr) {
            this.state.textStr = this.props.textStr;
        }
        this.modalClass = 'promptModal';
        this.promptStr = this.props.promptStr;
        if (this.props.severity === 'error') {
            this.title = 'Error';
        }
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }
    
    handleOpenModal() {
        
        // Set the text value here to get the cursor at the end.
        if (this.state.textStr) {
            $('.' + this.modalClass + ' input').val(this.state.textStr).focus();
        }
    }

    handleCloseModal (response) {
        this.props.closeModal(response);
    }
    
    handleButtonClick () {
        
        if (this.props.textStr) {
            this.handleCloseModal(this.state.textStr.trim());
        }
    }
  
    handleTextKeyPress (event) {
    
        // Make a return key press trigger the button.
        if (event.which === 13 || event.keyCode === 13) {
            this.handleButtonClick();
        }
    }
    
    handleTextChange (event) {
        this.state.textStr = event.target.value;
    }
        
    render () {
        var self = this,
            body = null,
            input = null,
            button = null;
        
        // Build the text box and buttons in the button box.
        if (this.props.textStr) {
            var input =
                <input
                    type = 'text'
                    onKeyPress = {self.handleTextKeyPress}
                    onChange = {self.handleTextChange}
                />,
                button = <button onClick = {function () {
                        self.handleButtonClick();
                    }}
                >
                    OK
                </button>;
        }
        body =
            <div>
                <div
                    className = 'modalLabel'>
                    {this.promptStr}
                </div>
                {input}
            </div>;
        
        return (
            <Modal
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {self.handleCloseModal}
                className = {this.modalClass + ' ' + this.props.severity}
                parentSelector = {() => $('#prompt')[0]}
                title = {this.title}
                body = {body}
                buttons = {button}
            />
        );
    }
}

var containerId = 'prompt',
    callback;

function closeModal (response) {

    // TODO hopefully this marks memory as garbage collectable.
    // If we could do this within the component the .show routine could be
    // removed and the caller would call the component directly.
    $('#' + containerId).remove();
    
    if (callback) {
        callback(response);
    }
}

exports.show = function (promptStr, opts) {
    
    // Create and render this modal.
    //
    // @param         promptStr: the prompt string
    // @param      opts.textStr: the text to put in the input box, optional
    // @param     opts.callback: function to call upon modal close, optional
    // @param opts.$callerModal: the caller's DOM class, optional
    // @param     opts.severity: one of [error, info, warning], optional
    
    callback = opts ? opts.callback : null;

    $('body').append($('<div id="' + containerId + '" />'));

    render(
        <Prompt
            promptStr = {promptStr}
            textStr = {opts.textStr}
            $callerModal = {opts.$callerModal}
            severity = {opts.severity}
            closeModal = {closeModal}
         />, $('#' + containerId)[0]);
}
