
// ReadFile.js
// Reads a local file into this web app.

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import utils from '/imports/common/utils.js';
import util from '/imports/common/util.js';

var readFile;

export class ReadFile extends Component {

    constructor (props) {
        super(props);
        this.state = props;
    }

    validate (result) {
    
        // Validate the data received and tsv-parse it if requested.
        if (_.isUndefined(result) || _.isNull(result) || result.length < 1) {
            this.state.onError('no data received ' +
            'Please upload a file of the requested format.');
        }
        var data = result;
        if (this.state.parseTsv) {
            data = util.parseTsv(result);
        }

        // Validate strings for printable characters
        if (utils.allPrintableCharsInArray(data)) {
            // Return the result to the parent.
            this.state.onSuccess(data);
        } else {
            this.state.onError('file contains unprintable characters');
        }
    }

    readNow (event) {
        var self = this;

        // When a file is selected, read it in.
        if (this.state.onStart) {
            this.state.onStart();
        }

        // Make a FileReader to read the file
        var reader = new FileReader();

        reader.onload = function() {

            // The file transfer is complete.
            self.validate(reader.result);
        };

        reader.onerror = function() {
            self.state.onError('Could not read file.');
        };
        reader.onabort = function() {
            self.state.onError('aborted reading file.');
        };

        try {
            // Kick of the file read.
            reader.readAsText(event.target.files[0]);
        } catch (error) {
            this.state.onError('you need to select a file.');
        }
    }

    render () {
        return (
            <input
                type = 'file'
                className = 'readFile'
                onChange = {this.readNow.bind(this)}
            />
        );
    }
}

ReadFile.propTypes = {

    // Flag to indicate the file read results should be parsed as TSV.
    parseTsv: PropTypes.bool,

    // Function to call when the file read starts.
    onStart: PropTypes.func,
    
    // Function to call when the file read and validation are complete.
    onSuccess: PropTypes.func.isRequired,
    
    // Function to call when there is an error.
    onError: PropTypes.func.isRequired,
};

ReadFile.defaultProps = {
    // none
};

var containerId = 'readFileWrap';

exports.show = function (wrapId, opts) {
    
    // Create and render a ReadFile instance from a non-react widget.
    // See ReadFile.propTypes for options.
    
    document.querySelector('#' + wrapId)
        .append(document.querySelector('#' + containerId));
    
    if (!readFile) {
    
        // Create the instance to be used throughout the app.
        //readfile = render(
        readFile =render(
            <ReadFile
                onSuccess = {opts.onSuccess}
                onError = {opts.onError}
             />, utils.createReactRoot(containerId));
    }
    
    // Set the new state of the component.
    readFile.setState(opts);
};

