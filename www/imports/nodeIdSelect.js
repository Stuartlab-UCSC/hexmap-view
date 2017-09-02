
// nodeIdSelect.js
// The UI to allow the user to select nodes by ID to create a new attribute.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Modal from './modal.js';
import './css/reactModal.css';

import Select2 from './select2wrap.js';
import ReadFile from './readFile.js';
import U from './utils.js';

class SelectByNodeId extends Component {

    constructor (props) {
        super(props);
        this.state = {
            cart: []
        };
        this.textBoxPlaceholder = 'enter node IDs one per line',
        this.modalClass = 'selectByNodeIdModal';
        this.searchPageSize = 20;

        // Save our selves.
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        
        this.selectQuery = this.selectQuery.bind(this);
        this.handleSelectLoaded = this.handleSelectLoaded.bind(this);
        this.handleSelectSelecting = this.handleSelectSelecting.bind(this);
        this.selectFormatResult = this.selectFormatResult.bind(this);
        
        this.handleReadSuccess = this.handleReadSuccess.bind(this);
        
        this.handleTextareaKeyPress = this.handleTextareaKeyPress.bind(this);
        this.handleTextareaChange = this.handleTextareaChange.bind(this);

        this.handleButtonClick = this.handleButtonClick.bind(this);
    }
    
    error (msg) {
        Util.banner('error', msg, $('.' + this.modalClass).parent());
    }
    
/**************** cart / textarea start *************************/

    updateCart () {
    
        // Update the cart array. The string has already been validated.
        // We need a cart update for two reason:
        //      - the button to create the attribute has been pressed
        //      - the dropdown is open and we want to show which nodes
        //        are already in the cart.
        
        var str = this.$text.val();
        
        if (_.isUndefined(str) || str.length < 1) {
            this.state.cart = [];
        } else {
        
            // Parse the string into an array of arrays
            // where the inner arrays contain one node ID each.
            var data = Util.parseTsv(str);
            
            // Flatten the nested arrays into a single array, remove any empty
            // lines, remove duplicates then replace the cart contents.
             this.state.cart =
                _.uniq(_.without(_.flatten(data), null, undefined));
        }
    }
    
    addToTextArea (str) {
    
        // Append new text to the text area. This comes from either the
        // dropdown or from an uploaded file. Uploaded files are
        // already checked for unprintable characters and we assume
        // node IDs from the dropdown have been check upon entry to the DB.
        
        // Add a new line if needed.
        var textVal = this.$text.val();
        if (textVal.length > 0 && !textVal.endsWith('\n')) {
            textVal += '\n';
        }
        this.$text.val(textVal + str);
    }
    
    handleTextareaChange (event) {
    
        // This handles updates to the textarea directly by the user,
        // including cutting and pasting.
        // This excludes those updates added programatically, like from
        // the search/selector or from a file upload.
        
        if (this.textareaKeyPressValidated) {
        
            // We already validated this key press.
            this.textareaKeyPressValidated = false;
            return;
        }

        // User modified textarea without a keyPress, so validate.
        var val = event.target.value.slice();
        
        // Look at the entire text because we don't know what changed.
        while (i < val.length) {
            var bad;
            
            // Get ascii code in decimal representation and check for bad.
            try {
                var code = val.charCodeAt(i);
                bad = U.unprintableAsciiCode(code);

            } catch (error) {
            
                bad = true;
            }
            if (bad) {
            
                // Drop this character.
                var newVal = val.slice(0, i) + val.slice(i + 1);
                val = newVal;
                bad = false;
                
            } else {
                i += 1;
            }
        }
        
        $(event.target).val(val);
    }
    
    handleTextareaKeyPress (event) {
    
        // Don't allow unprintables here except newLine.
        // This does not capture cutting or pasting in the testarea.
        
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
        $('.selectByNodeIdModal textarea').focus();
        this.$text = $('.selectByNodeIdModal textarea');
        
        // Build the list of node IDs.
        this.allNodeIds = Object.keys(polygons).sort();
    }
  
    handleCloseModal () {
        this.props.closeModal();
    }
    
    handleReadSuccess (data) {
        this.addToTextArea(_.flatten(data).join('\n'));
    }
    
    handleButtonClick () {

        this.updateCart();
    
        // Create the new attribute.
        if (this.state.cart.length < 1) {
            this.error('no valid node IDs so attribute cannot be created');
            return;
        }
        
        // Create the attribute.
        Layer.create_dynamic_selection(this.state.cart);
        
        this.handleCloseModal();
    }
 
/**************** select2 start ***********************************************/

    isInCart (id) {
        return (this.state.cart.indexOf(id) > -1);
    }
    
    setDropdownSelectStatus () {
    
        console.log("setDropdownSelectStatus(): cart", this.state.cart);
        console.log("$('.selectByNodeDropdown li span')",
            $('.selectByNodeDropdown li span'));
    
        // For each item in the dropdown, update its select status.
        var self = this,
            $els = $('.selectByNodeDropdown li span');
        
        this.updateCart();
        
        _.each($els, function (el) {
            var $el = $(el);
            
            console.log("$el:", $el);
            console.log("text:", $el.text());
            
            if (self.isInCart($el.text())) {
                $el.addClass('selected');
            } else {
                $el.removeClass('selected');
            }
        });
    }
    
    handleSelectSelecting (event) {
    
        // Handler for after the click and before adding to the cart,
        // so we can skip the function to put the selection in the choice box.

        // If the ID is not already in the cart...
        if (!this.isInCart(event.val)) {
        
            // Add it to the cart.
            this.addToTextArea(event.val);
        
            // Update the selected status of the dropdown items.
            this.setDropdownSelectStatus();
        }
        
        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        event.preventDefault();
    }
    
    handleSelectLoaded (items) {
    
        // Handler for after the query completes and dropdown
        // has been updated.
        // Update the selected status of the dropdown items.
        this.setDropdownSelectStatus();
    }
    
    selectQuery (query) {
    
        // Given a select2 query object, find any matches and
        // call query.callback with the results.
        
        var results = [];

        // Get where we should start in the layer list,
        // from select2's infinite scrolling.
        var start_position = 0,
            allIds = this.allNodeIds;
        
        if (query.context != undefined) {
            start_position = query.context;
        }
        
        for (var i = start_position; i < allIds.length; i++) {
        
            var check = allIds[i].toLowerCase()
                    .indexOf(query.term.toLowerCase());

            // Is the search term in this node ID?
            if (check > -1) {
                
                // Query search term is in this node ID,
                // so add a select2 record to our results.
                results.push({
                    id: allIds[i],
                    text: allIds[i],
                });
                
                if (results.length >= this.searchPageSize) {
                
                    // Page is full. Send it on.
                    break;
                }
            }
        }
    
        // Give the results back to select2 as the results parameter.
        query.callback({
            results: results,
            
            // Say there's more if we broke out of the loop.
            more: i < allIds.length,
            
            // If there are more results, start after where we left off.
            context: i + 1
        });
    }
    
    selectFormatResult (result, container, query) {
    
        // Given a select2 result record, the element that our results go
        // in, and the query used to get the result, return a jQuery element
        // as the result.
        // If the entry is selected, add a class to the element to
        // highlight the entry.
        
        return $("<span class='nodeId" +
            (this.isInCart(result.in) ? ' selected' : '') +
            //(this..state.cart.indexOf(result.in) > -1 ? ' selected' : '') +
            "'>" + result.id + "</span>");
    }

    render () {
        var self = this,
            select2 =
                <Select2
                    select2-loaded = {self.handleSelectLoaded}
                    select2-selecting = {self.handleSelectSelecting}
                    select2options = {{
                        data: { id: '', text: '' },
                        dropdownCssClass: 'selectByNodeDropdown',
                        dropdownParent: this.props.selectDropDownParent,
                        formatResult: self.selectFormatResult,
                        placeholder: 'Search nodes...',
                        query: self.selectQuery,
                        value: null,
                        width: '43em',
                    }}
                />,
                
/**************** select2 end *************************************************/
        
            body =
                <div>
                    {select2}
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
                        placeholder = {this.textBoxPlaceholder}>
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
                className = {this.modalClass}
                parentSelector = {() => $('#selectByNodeIdContainer')[0]}
                body = {body}
                buttons = {button}
            />
        );
    }
}

var containerId = 'selectByNodeIdContainer';

function closeModal (result) {

    // TODO" hopefully this marks memory as garbage collectable.
    $('#' + containerId).remove();
}

exports.show = function () {

    // Create and render this modal.
    $('body').append($('<div id=' + containerId + ' />'));
    render(
        <SelectByNodeId
            closeModal = {closeModal}
            selectDropDownParent = {$('#' + containerId)}
         />, $('#' + containerId)[0]);
}
