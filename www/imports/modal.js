
// modal.js
// Our wrapper around react-model to add our common options

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import ReactModal from 'react-modal';
import './css/reactModal.css';

export default class Modal extends Component {
    constructor (props) {
        super(props);

        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleCancelModal = this.handleCancelModal.bind(this);
    }
    
    handleOpenModal (event) {
        
        // Hide the instance parent modal if there is one.
        var parent = this.props.$parentModal;
        if (parent) {
            parent.hide();
        }
        
        // Call the instance onAfterOpen if there is one.
        var after = this.props.onAfterOpen;
        if (after) {
            after(event);
        }
    }
  
    handleCloseModal (response) {
    
        // Show the instance parent modal if there is one.
        var parent = this.props.$parentModal;
        if (parent) {
            parent.show();
        }
        
        // Call the instance handleCloseModel if there is one.
        var close = this.props.onRequestClose;
        if (close) {
            close(response);
        }
    }
    
    handleCancelModal (event) {
    
        // User clicked on the close button in the upper right
        // or outside of the modal, so close without a response.
        this.handleCloseModal();
    }
    
    render () {
        var self = this;
        
        return (
            <ReactModal
                isOpen = {true}
                contentLabel = 'useless'
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {self.handleCancelModal}
                className = {this.props.className + ' modal'}
                parentSelector = {this.props.parentSelector}
            >
                <div className = 'modalHeader'>
                    <span>
                        {this.props.title}
                    </span>
                    <button
                        className = 'close'
                        title = 'Close'
                        onClick = {self.handleCancelModal}
                    >
                        x
                    </button>
                </div>
                <div className = 'modalBody'>
                    {this.props.body}
                </div>
                <div className = 'modalButtons'>
                    {this.props.buttons}
                </div>
            </ReactModal>
        );
    }
}
