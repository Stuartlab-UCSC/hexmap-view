
// Namer.js
// A modal to prompt the user to name something.
// If you want something more complex use Modal.js instead.

import React, { Component } from 'react';
//import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Modal from './Modal.js';

export default class Namer extends Component {
    constructor (props) {
        super(props);
        this.state = props;
        
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleOkButtonClick = this.handleOkButtonClick.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }
    
    handleCloseModal (response) {
    
        // We handle the callback here, rather than in Modal, so we can
        // fix up the response.
        this.setState({ isOpen: false });
        if (this.state.callback) {
            if (_.isUndefined(response) || typeof response !== 'string') {
                this.state.callback();
            } else {
                this.state.callback(response);
            }
        }
    }
    
    handleOkButtonClick () {
        this.handleCloseModal(this.state.textInputStr.trim());
    }
  
    handleTextKeyPress (event) {

        // Allow an 'Enter' key press to trigger the button.
        if (event.key === "Enter") {
            this.handleOkButtonClick();
        }
    }
    
    handleTextChange (event) {
        this.setState({ textInputStr: event.target.value });
    }
    
    componentDidUpdate () {
        var self = this;
        
        // Set the text value here to force the cursor to the end.
        setTimeout(function () {
            if (self.$text) {
                self.$text.val(self.state.textInputStr).focus();
            }
        }, 300);
    }
    
    renderButton (self) {
        
        // Build the button.
        var button =
            <button
                onClick = {self.handleOkButtonClick}
                className = 'defaultButton'
            >
                OK
            </button>
        ;
        return button;
    }

    renderTextInput (self) {
    
        // Build the text input box.
        var input =
            <input
                type = 'text'
                onKeyPress = {self.handleTextKeyPress}
                onChange = {self.handleTextChange}
                style={{ width: '20em' }}
                ref={(input) => { this.$text = $(input); }}
            />
        ;
        
        return input;
    }
    
    renderPromptStr (self) {

        // Convert any single string msg to an array of one msg.
        var msg = self.state.promptStr,
            msgArray = (typeof msg === 'string') ? [msg] : msg;
        
        return msgArray.map((str, i) =>
            <p key = {i} >
                {str}
            </p>
        );
    }
    
    render () {

        // Only show when isOpen state is true.
        if (!this.state.isOpen) {
            return null;
        }
        
        var self = this;
        
        return (
            <Modal
                isOpen = {self.state.isOpen}
                onRequestClose = {self.handleCloseModal}
                body = {
                    <div>
                        {this.renderPromptStr(self)}
                        {this.renderTextInput(self)}
                    </div>
                }
                buttons = {this.renderButton(self)}
            />
        );
    }
}

Namer.propTypes = {

    // The text to display as a prompt to the user;  either a string
    // or an array of strings, one per paragraph.
    promptStr: PropTypes.string.isRequired,

    // Controls the modal visibility.
    isOpen: PropTypes.bool,

    // The default text to display in the text input box.
    textInputStr: PropTypes.string,

    // Function to call upon modal close.
    callback: PropTypes.func,
};

Namer.defaultProps = {
    isOpen: true,
    textInputStr: '',
};
