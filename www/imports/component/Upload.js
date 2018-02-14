
// Upload.js

import React, { Component } from 'react';

export default class Upload extends Component {

    // TODO fix deprecated refs.
    
    saveFile () {
        this.refs.fileObj = this.refs.file.files[0]; // eslint-disable-line
    }

    render () {
        return (
            <form
                method = 'POST'
                encType = 'multipart/form-data'>
                <input
                    ref = 'file' // eslint-disable-line
                    type = 'file'
                    name = 'file'
                    className = 'readFile'
                    onChange = {this.saveFile.bind(this)}
                />
            </form>
        );
    }
}
