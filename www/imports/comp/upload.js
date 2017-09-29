
// upload.js

import React, { Component } from 'react';
import { render } from 'react-dom';

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
                className = 'readFile'
                onChange = {this.saveFile.bind(this)}
            />
        );
    }
};
