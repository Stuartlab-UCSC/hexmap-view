
// TextAreaClean.js
// A textarea to contain text that contains only printable characters.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import utils from '/imports/common/utils.js';

export default class TextareaClean extends Component {

    constructor (props) {
        super(props);
        
        this.state = { value: this.props.value };

        // Save our selves.
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount () {
    
        // Set focus on this textarea if the parent did not override.
        if (!this.props.noFocus) {
            $(this.textarea).focus();
        }
    }
  
    handleChange (event) {
    
        // This handles updates to the textarea directly by the user,
        // including cutting and pasting, and a user keypress.
        
        var val = event.target.value;
        
        // Skip this if we already validated with the key press.
        if (this.alreadyValidated) {
            this.alreadyValidated = false;
        } else {
        
            // Drop unprintables from the updated text. we need to look at the
            // entire text because we don't know what changed.
            utils.dropUnprintables(val);
        }
       
        // Let the parent know.
        this.props.onChange(val);
    }
    
    handleKeyPress (event) {
    
        // Don't allow unprintables here except newLine.
        // This does not capture cutting or pasting in the textarea.
        
        // If this is an unprintable character...
        if (utils.unprintableAsciiCode(event.which, true)) {
        
            // Prevent the display from being updated with the bad value.
            event.preventDefault();
        } else {
        
            // Mark this character as validated.
            this.alreadyValidated = true;
        }
    }

    render () {
        return (
            <textarea
                onKeyPress = {this.handleKeyPress}
                onChange = {this.handleChange}
                value = {this.props.value}
                className = {this.props.className}
                placeholder = {this.props.placeholder}
                rows = {this.props.rows}
                cols = {this.props.cols}
                ref={(textarea) => { this.textarea = textarea; }}
            />
        );
    }
}

TextareaClean.propTypes = {

    // Function to call when the textarea changes.
    onChange: PropTypes.func.isRequired,

    // Value of the textarea that the parent owns.
    value: PropTypes.string.isRequired,

    // An application-unique class to add to the textarea.
    className: PropTypes.string,
    
    // Text to display when the textarea is empty.
    placeholder: PropTypes.string,

    // Number of rows and columns.
    rows: PropTypes.string,
    cols: PropTypes.string,
    
    // True means to not set focus to this element.
    noFocus: PropTypes.bool,
};

TextareaClean.defaultProps = {
    rows: '10',
    cols: '20',
    noFocus: false,
};

  
