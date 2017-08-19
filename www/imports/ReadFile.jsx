
// ReadFile.jsx
// Reads a local file into this web app.

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

export default class ReadFile extends Component {

    constructor (props) {
        super(props);
        
        // TODO: this is only used internally and
        // does not need to be in persistent store.
        this.state = { fileObject: '' };
    }
    
    validate (result) {
    
        // Validate the data received and tsv-parse it if requested.
        if (_.isUndefined(result) || _.isNull(result) || result.length < 1) {
            this.props.onError('no data received ' +
            'Please upload a file of the requested format.');
        }
        var data = result;
        if (this.props.parseTsv) {
            data = Util.parseTsv(result);
        }

        // Validate strings for printable characters
        if (Util.allPrintableCharacters(data)) {
            // Return the result to the parent.
            this.props.onSuccess(data);
        } else {
            this.props.onError('data contains unprintable characters')
        }
    }

    readNow (event) {
        var self = this;

        // When a file is selected, read it in.
        this.props.onStart();

        // Make a FileReader to read the file
        var reader = new FileReader();

        reader.onload = function(read_event) {

            // The file transfer is complete.
            self.validate(reader.result);
        };

        reader.onerror = function(read_event) {
            self.props.onError('Could not read file.');
        };
        reader.onabort = function(read_event) {
            self.props.onError('aborted reading file.');
        };

        try {
            // Kick of the file read.
            reader.readAsText(event.target.files[0]);
        } catch (error) {
            this.props.onError('you need to select a file.');
        }
    }

    render () {
        return (
            <input
                ref = 'file'
                type = 'file'
                name = 'file'
                className = 'readFile'
                value = {this.state.fileObject}
                onChange = {this.readNow.bind(this)}
            />
        );
    }
};
