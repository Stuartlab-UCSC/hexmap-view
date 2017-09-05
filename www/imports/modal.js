
// modal.js
// Our wrapper around react-model to add our own options of:
//      - styling
//      - header
//          - title
//          - close button
//      - body
//      - button box

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import ReactModal from 'react-modal';
import './css/reactModal.css';

export default class Modal extends Component {
    constructor (props) {
        super(props);
        this.state = {
            isOpen: (props.isOpen === false) ? false : true,
        }
        
        this.handleCancelModal = this.handleCancelModal.bind(this);
    }
    
    handleCancelModal (event) {
    
        // User clicked on the close button in the upper right
        // or outside of the modal, so close without a response.
        if (this.props.onRequestClose) {
            this.props.onRequestClose();
        }
    }
    
    render () {
        var self = this;
        
        return (
            <ReactModal
                isOpen = {self.state.isOpen}
                contentLabel = 'useless'
                onAfterOpen = {this.props.onAfterOpen}
                onRequestClose = {this.props.onRequestClose}
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
