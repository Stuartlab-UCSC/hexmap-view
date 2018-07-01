
// okCancel.js
// A modal to prompt the user for an 'OK' or Cancel' where 'OK is the default
// button which is triggered with a click on the return key.
// If you want something more complex use Modal.js instead.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Modal from './Modal.js';

export default class okCancel extends Component {
    constructor (props) {
        super(props);
        this.state = props;
        
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleOkButtonClick = this.handleOkButtonClick.bind(this);
        this.handleCancelButtonClick = this.handleCancelButtonClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }
    
    handleCloseModal (response) {
        this.setState({ isOpen: false });
        if (this.state.callback) {
            if (_.isUndefined(response) || typeof response !== 'boolean') {
                this.state.callback(false);
            } else {
                this.state.callback(response);
            }
        }
    }
    
    handleOkButtonClick () {
        this.handleCloseModal(true);
    }
  
    handleCancelButtonClick () {
        this.handleCloseModal(false);
    }
    
    handleKeyPress (event) {

        // Allow an 'Enter' key press to trigger the default button.
        if (event.key === "Enter") {
            this.handleOkButtonClick();
        }
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
            <div
                onKeyPress = {self.handleKeyPress}
            >
                <Modal
                    isOpen = {self.state.isOpen}
                    onRequestClose = {self.handleCloseModal}
                    body = {
                        <div>
                            {this.renderPromptStr(self)}
                        </div>
                    }
                    buttons = {
                        <div>
                            <button
                                onClick = {self.handleOkButtonClick}
                                className = 'defaultButton'
                            >
                                OK
                            </button>
                            <button
                                onClick = {self.handleCancelButtonClick}
                            >
                                Cancel
                            </button>
                        </div>
                    }
                />
            </div>
        );
    }
}

okCancel.propTypes = {

    // The text to display as a prompt to the user;
    // either a string or an array of strings, one per paragraph.
    promptStr: PropTypes.string.isRequired,

    // Controls the modal visibility.
    isOpen: PropTypes.bool,

    // Function to call upon modal close.
    callback: PropTypes.func,
};

okCancel.defaultProps = {
    isOpen: true,
};
