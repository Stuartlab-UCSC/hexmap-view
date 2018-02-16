
// Modal.js
// Our wrapper around react-model to add our own options of:
//      - styling
//      - header
//          - title
//          - close button
//      - body
//      - button box
// If you want something more simple with just a prompt string, an optional text
// field and an optional OK button, use Prompts.js instead.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ReactModal from 'react-modal';
import './reactModal.css';

export default class Modal extends Component {
    constructor (props) {
        super(props);
        this.state = {
            isOpen: props.isOpen,
        };
        
        this.handleCancelModal = this.handleCancelModal.bind(this);
    }
    
    handleCancelModal (event) {
    
        // User clicked on the close button in the upper right
        // or outside of the modal, so close without a response.
        if (this.props.onRequestClose) {
            
            // Stop propagation of the event so that that react close event will
            // not execute twice when a modal is closed by clicking the close
            // button. This is a work-around for a react bug.
            // TODO only works sometimes.
            event.stopPropagation();
            
            // Execute the given close event handler.
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
                onRequestClose = {self.props.onRequestClose}
                className = {this.props.className + ' modal'}
                parentSelector = {self.props.parentSelector}
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
Modal.propTypes = {

    // Text to put in the header.
    // Pass-thru to react-modal.
    title: PropTypes.string,
    
    // The body jsx definition of the body.
    body: PropTypes.element,
    
    // One or more buttons at the bottom.
    buttons: PropTypes.element,

    // A css class to add to the react-modal.
    className: PropTypes.string,
    
    // Visibility of this component, passed thru to ReactModal.
    isOpen: PropTypes.bool,
    
    // Function to retrieve the DOM container element.
    // Pass-thru to the React-modal.
    parentSelector: PropTypes.func,
    
    // Function to call when a modal is about to be closed.
    // Pass-thru to react-modal.
    onRequestClose: PropTypes.func,
    
    // Function to call after the modal opens.
    // Pass-thru to react-modal.
    onAfterOpen: PropTypes.func,
};

Modal.defaultProps = {
    isOpen: true,
};
