
// nodeIdSelect.js
// The UI to allow the user to select nodes by ID to create a new attribute.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Modal from './modal.js';
import './css/reactModal.css';

import NodeIdSearch from './nodeIdSearch.js';
import ReadFile from './readFile.js';
import U from './utils.js';

class NodeIdSelect extends Component {

    constructor (props) {
        super(props);
        this.textBoxPlaceholder = 'enter node IDs one per line',

        // Save our selves.
        this.addToTextArea = this.addToTextArea.bind(this);
        this.getCart = this.getCart.bind(this);
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleReadSuccess = this.handleReadSuccess.bind(this);
        this.handleTextareaKeyPress = this.handleTextareaKeyPress.bind(this);
        this.handleTextareaChange = this.handleTextareaChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.error = this.error.bind(this);
    }
    
    error (msg) {
        Util.banner('error', msg, $(this.modal).parent());
    }
    
/**************** cart / textarea start *************************/

    getCart (onTextChange) {
        
        // Update and return the cart array from the textarea contents.
        // The contents have already been validated.
        // We need a cart update for two reason:
        //      - the button to create the attribute has been pressed
        //      - the dropdown is open and we want to show which nodes
        //        are already in the cart.
        
        var str = this.$text.val(),
            cart = [];
        
        // If there is a textarea string...
        if (!(_.isUndefined(str) || str.length < 1)) {
        
            // Parse the string into an array of arrays
            // where the inner arrays contain one node ID each.
            var data = Util.parseTsv(str);
            
            // Flatten the nested arrays into a single array,
            // remove white space from the ends of each element,
            // remove any empty elements,
            // remove duplicate elements,
            // then replace the cart contents.
            cart = _.uniq(_.without(
                _.map(_.flatten(data), function (el) {
                    return el.trim();
                }),
                null, ''));
        }
        return (cart);
    }
    
    addToTextArea (newText) {
    
        // Append new text to the text area. This comes from either the
        // dropdown or from an uploaded file. Uploaded files are
        // already checked for unprintable characters and we assume
        // node IDs from the dropdown have been check upon entry to the DB.
        
        // Add a new line if needed.
        var text = this.$text.val();
        if (text.length > 0 && !text.endsWith('\n')) {
            text += '\n';
        }
        this.$text.val(text + newText);
    }
    
    handleTextareaChange (event) {
    
        // This handles updates to the textarea directly by the user,
        // including cutting and pasting.
        // This excludes those updates added programatically, like from
        // the search or from a file upload.
        
        if (this.textareaKeyPressValidated) {
        
            // We already validated this key press.
            this.textareaKeyPressValidated = false;
            return;
        }

        // User modified textarea without a keyPress, so validate.
        var val = event.target.value.slice();
        
        // Drop unprintable from the updated text. we need to look at the
        // entire text because we don't know what changed.
        U.dropUnprintables(val);
        $(event.target).val(val);
    }
    
    handleTextareaKeyPress (event) {
    
        // Don't allow unprintables here except newLine.
        // This does not capture cutting or pasting in the textarea.
        
        if (U.unprintableAsciiCode(event.which, true)) {

            // Don't allow this value to be added to the textbox.
            event.preventDefault();
        } else {
        
            // Mark this char as validated to we don't validate it again.
            this.textareaKeyPressValidated = true;
        }
    }
    
/**************** end cart / textarea *************************/
    
    
    handleOpenModal () {
    
        // Set focus on the textarea and save its DOM element.
        this.$text.focus();
    }
  
    handleCloseModal () {
        this.props.closeModal();
    }
    
    handleReadSuccess (data) {
        this.addToTextArea(_.flatten(data).join('\n'));
    }
    
    handleButtonClick () {

        // Not needed if we update with every textarea change
        var cart = this.getCart();
    
        // Create the new attribute.
        if (cart.length < 1) {
            this.error('no valid node IDs so attribute cannot be created');
            return;
        }
        
        // Create the attribute.
        Layer.create_dynamic_selection(cart);
        
        this.handleCloseModal();
    }

    render () {
        var self = this,        
            body =
                <div>
                    <NodeIdSearch
                        addToSelectedList = {self.addToTextArea}
                        getCart = {this.getCart}
                        dropdownParent = {this.props.searchDropDownParent}
                    />
                    <div>
                        <span>
                            Or
                        </span>
                        <ReadFile
                            parseTsv = {true}
                            onSuccess = {this.handleReadSuccess}
                            onError = {this.error}
                        />
                    </div>
                    <div className = 'cartLabel'>
                        Or direct to Your Cart
                    </div>
                    <textarea
                        onKeyPress = {this.handleTextareaKeyPress}
                        onChange = {this.handleTextareaChange}
                        rows = '10'
                        cols = '35'
                        placeholder = {this.textBoxPlaceholder}
                        ref={(textarea) => { this.$text = $(textarea); }}>
                    </textarea>
                </div>,
            button =
                <button onClick = {function () {
                        self.handleButtonClick();
                    }}>
                    OK
                </button>;

        return (
            <Modal
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {self.handleCloseModal}
                className = 'nodeIdSelectModal'
                parentSelector = {() => this.props.parentSelector}
                body = {body}
                buttons = {button}
                ref={(Modal) => { this.modal = Modal; }}
            />
        );
    }
}

var containerId = 'nodeIdSelectContainer';

function closeModal (result) {
    $('#' + containerId).remove();
}

exports.show = function () {

    // Create and render this modal.
    $('body').append($('<div id=' + containerId + ' />'));
    var parentSelector = $('#' + containerId);
    render(
        <NodeIdSelect
            closeModal = {closeModal}
            parentSelector = {parentSelector[0]}
            searchDropDownParent = {parentSelector}
         />, parentSelector[0]);
}
