
// textArea.js
// textarea html wrapper.

import React, { Component } from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

export default class TextArea extends Component {

    constructor (props) {
        super(props);
         this.state = {
            value: (props.hasOwnProperty('value')) ? props.value : '';
        };

    render () {
        return (
            <textarea
                className = {this.props.className}
                rows = {this.props.rows}
                cols = {this.props.cols}
                placeholder = {this.props.placeholder}
                value = {this.state.value}
            />
        );
    }
};
