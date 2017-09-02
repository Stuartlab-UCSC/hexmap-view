
// upload.js

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

export default class Upload extends Component {
    
    saveFile (event) {
        this.refs.fileObj = this.refs.file.files[0];
    }

    render () {
        return (
            <input
                ref = 'file'
                type = 'file'
                name = 'file'
                className = 'upload-file'
                onChange = {this.saveFile.bind(this)}
            />
        );
    }
};
