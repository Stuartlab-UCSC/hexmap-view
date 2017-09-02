
// prompt.js
// The UI to prompt the user with a string and an optional text field.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import ReactModal from 'react-modal';
import './css/reactModal.css';

class Prompt extends Component {
    constructor (props) {
        super(props);
        this.state = {};
        if (this.props.textStr) {
            this.state.textStr = this.props.textStr;
        }
        this.class = 'promptModal';
        this.promptStr = this.props.promptStr;
        if (this.props.severity === 'error') {
            this.title = 'Error';
        }
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleCancelModal = this.handleCancelModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }
    
    handleOpenModal() {
        
        // Set the text value here to get the cursor at the end.
        if (this.props.textStr) {
            $('.' + this.class + ' input').val(this.state.textStr).focus();
        } else {
            $('.' + this.class).blur();
        }
        
        // Hide the caller modal.
        var caller = this.props.$callerModal;
        if (caller) {
            caller.hide();
        }
    }
  
    handleCloseModal (response) {
        var caller = this.props.$callerModal;
        if (caller) {
            caller.show();
        }
        this.props.closeModal(response);
    }
    
    handleCancelModal () {
        this.handleCloseModal();
    }
    
    handleButtonClick () {
        if (this.props.textStr) {
            this.handleCloseModal(this.state.textStr.trim());
        }
    }
  
    handleTextKeyPress (event) {
        if (event.which === 13 || event.keyCode === 13) {
            this.handleButtonClick();
        }
    }
    
    handleTextChange (event) {
        this.state.textStr = event.target.value;
    }
        
    render () {
        var self = this,
            title = null,
            input = null,
            button = null;
        
        if (this.title) {
            title = <span>
                {this.title}
            </span>
        }
        
        // Build the text box and buttons in the button box.
        if (this.props.textStr) {
            var input = <input
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
        
        return (
            <ReactModal
                isOpen = {true}
                contentLabel = 'useless'
                onAfterOpen = {self.handleOpenModal}
                onRequestClose = {self.handleCancelModal}
                className = {this.class + ' ' + this.props.severity + ' modal'}
                parentSelector = {() => $('#prompt')[0]}
            >
                <div className = 'modalHeader'>
                    {title}
                    <button
                        className = 'close'
                        title = 'Close'
                        onClick = {self.handleCancelModal}
                    >
                        X
                    </button>
                </div>
                <div className = 'modalBody'>
                
                    <div className = 'modalLabel'>
                        {this.promptStr}
                    </div>
                    {input}
                    <div className = 'buttonBox'>
                        {button}
                    </div>
                </div>
            </ReactModal>
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
