
// selectByNodeId.js
// The UI to allow the user to select nodes by ID to create a new attribute.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ReactModal from 'react-modal';
import 'jquery';
import './css/reactModal.css';
//import Select from 'react-select';
//import 'react-select/dist/react-select.css';
import Select2 from 'react-select2-wrapper';
import 'react-select2-wrapper/css/select2.css';
import './css/select.css';
import ReadFile from './ReadFile.jsx';
import U from './utils.js';

class SelectByNodeId extends Component {
    constructor (props) {

        super(props);
        this.state = {
            textString: '',
        };
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleReadSuccess = this.handleReadSuccess.bind(this);
    }

    validateString (str) {
    
        // Validate the data as a single string and remove any carriage returns.
        // @param str: the string to validate
        // @returns: the string with carriage returns removed,
        //           or undefined if not valid.
        
        if (_.isUndefined(str) || _.isNull(str) || str.length < 1) {
            Util.banner('error', 'no node IDs provided');
            return;
        }
        var valid = U.allPrintableCharsInString(str, true);
        if (valid) {
            return U.removeCarriageReturns(str);
        } else {
            return;
        }
    }
    
    validateAndTransform (str) {
    
        // Validate the data and transform it into an array.
        // @param str: the string to validate and transform
        // @returns: the data as an array, or undefined if not valid.
        
        var validStr = this.validateString(str);

        if (_.isUndefined(validStr)) {
            return;
        }
        U.removeCarriageReturns(validStr);

        // Parse the string into an array of arrays
        // where the inner arrays contain one node ID each.
        var data = Util.parseTsv(validStr);
        
        // Flatten the nested arrays into a single array
        // and remove any empty elements.
        var cleanData = _.without(_.flatten(data), null, undefined);

        if (cleanData.length > 0) {
            return cleanData;
        } else {
            return;
        }
    }
    
    addToTextArea (str) {
    
        // Append new text to the text area.
        
        // Look for printable chars allowing new lines.
        var validStr = this.validateString(str);
        if (_.isUndefined(validStr)) {
            return;
        }
        
        // Add a new line if needed.
        if (this.state.textString.length > 1 &&
            !this.state.textString.endsWith('\n')) {
            this.state.textString += '\n';
        }
        this.state.textString += validStr;
        this.$text.val(this.state.textString);
    }
    
    handleOpenModal () {
        $('.selectByNodeIdModal textarea').focus();
        this.$text = $('.selectByNodeIdModal textarea');
    }
  
    handleCloseModal () {
        this.props.closeModal();
    }
    
    handleReadSuccess (data) {
        this.addToTextArea(_.flatten(data).join('\n'));
    }
    
    handleReadStart () {
        // TODO make this optional for the readFile widget
    }
    
    handleReadError (msg) {
        Util.banner('error', msg);
    }
    
    handleButtonClick () {

        // Validate the node IDs in the textarea,
        // and transform from a string to an array of one node per entry.
        var data = this.validateAndTransform(this.state.textString);
        if (_.isUndefined(data)) {
            Util.banner('error', 'no valid node IDs provided');
            return;
        }
        
        // Create the attribute.
        Layer.create_dynamic_selection(data);
        
        this.handleCloseModal();
    }
  
    buildSelectorData () {
        
        // Build the data for the node ID selector.
        return _.map(Object.keys(polygons).sort(), function (id) {
            return { 'id': id, 'text': id };
            //return { 'value': id, 'label': id };
        })
    }
  
    render () {
        var self = this,
            textBoxPlaceholder = 'enter node IDs one per line,\n' +
                'or search for nodes,\nor upload a file',
            selectPlaceholder = 'Search nodes...';
        
        function handleTextareaChange (event) {
            self.state.textString = event.target.value;
        }
        
        function handleSelectChange(event) {
        
            console.log('event.added.id:', event.added.id);
            
            self.addToTextArea(event.added.id);
        }

        return (
            <ReactModal
                isOpen = {true}
                contentLabel = "Minimal Modal Example"
                onAfterOpen = {this.handleOpenModal}
                onRequestClose = {this.handleCloseModal}
                className = 'selectByNodeIdModal'
                parentSelector = {() => $('#selectByNodeIdContainer')[0]}
            >
                <div className='modalTitle'>
                    Select Nodes by ID
                </div>
                <div className='modalContent'>
                    <Select2
                        data = {this.buildSelectorData()}
                        value = ''
                        options = {{
                            placeholder: this.selectPlaceholder,
                            width: 700,
                        }}
                        onChange = {handleSelectChange}
                    />
                    <ReadFile
                        parseTsv = {true}
                        onSuccess = {this.handleReadSuccess}
                        onStart = {this.handleReadStart}
                        onError = {this.handleReadError}
                    />
                    <textarea
                        onChange= {handleTextareaChange}
                        defaultValue = {this.state.textString}
                        rows = '10'
                        cols = '35'
                        placeholder = {textBoxPlaceholder}>
                    </textarea>
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
         />, $('#' + containerId)[0]);
}
