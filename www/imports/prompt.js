
// prompt.js
// The UI to prompt the user with a string and an optional text field.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import ReactModal from 'react-modal';
import './css/reactModal.css';

class Prompt extends Component {
    constructor (props) {
        super(props);
        this.state = {
            textStr: this.props.textStr,
        };
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }

    handleOpenModal () {
    
        // Set the value here to get the cursor at the end.
        $('.promptModal input').val(this.state.textStr).focus();
    }
  
    handleCloseModal (response) {
        this.props.closeModal(response);
    }
    
    handleButtonClick () {
       this.handleCloseModal(this.state.textStr.trim());
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
        var self = this;
        
        return (
            <ReactModal
                isOpen = {true}
                contentLabel = 'useless'
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {this.handleCloseModal}
                className = 'promptModal'
                parentSelector = {() => $('#prompt')[0]}
            >
                <div className = 'modalContent'>
                    <div className = 'modalLabel'>
                        {this.props.promptStr}
                    </div>
                    <input
                        type = 'text'
                        onKeyPress = {this.handleTextKeyPress}
                        onChange = {this.handleTextChange}
                    />
                    <div className = 'buttonBox'>
                        <button onClick = {function () {
                                self.handleButtonClick();
                            }}
                            >OK</button>
                    </div>
                </div>
            </ReactModal>
        );
    }
}

var containerId = 'prompt',
    callback;

function closeModal (response) {

    // TODO" hopefully this marks memory as garbage collectable.
    $('#' + containerId).remove();
    callback(response);
}

exports.show = function (promptStr, textStr, callbackIn) {
    
    // Save the caller' callback
    callback = callbackIn;

    // Create and render this modal.
    $('body').append($('<div id="prompt" />'));

    render(
        <Prompt
            promptStr = {promptStr}
            textStr = {textStr}
            callback = {callback}
            closeModal = {closeModal}
         />, $('#' + containerId)[0]);
}
