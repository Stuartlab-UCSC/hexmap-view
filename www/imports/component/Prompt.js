
// Prompt.js
// The UI to prompt the user with a string, an optional text field and an
// optional OK button.
// If you want something more complex than the above elements, use
// Modal.js instead.

import React, { Component } from 'react';
//import { render } from 'react-dom';
import PropTypes from 'prop-types';

import Modal from './Modal.js';

export default class Prompt extends Component {
    constructor (props) {
        
        super(props);
        this.state = props;
        this.modalClass = 'promptModal';
        
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleTextKeyPress = this.handleTextKeyPress.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.componentWillUpdate = this.componentWillUpdate.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }
    
    getParentSelector () {
        this.parentSelector = document.querySelector('#' + this.state.wrapId);
    }
        
    handleCloseModal (response) {
        
        // Only allow string or undefined responses to be returned.
        clearTimeout(this.fadeAwayTimer);
        
        if (this.state.closeHandler) {
            let closeHandler = this.state.closeHandler;
            this.setState({ closeHandler: null });
            if (_.isUndefined(response) || typeof response !== 'string') {
                closeHandler(this.state.wrapId);
            } else {
                closeHandler(this.state.wrapId, response);
            }
        }
    }
    
    handleButtonClick () {
        if (this.state.textInputStr) {
            this.handleCloseModal(this.state.textInputStr.trim());
        } else {
            this.handleCloseModal();
        }
    }
  
    handleTextKeyPress (event) {

        // Allow a return key press to trigger the button.
        if (event.which === 13 || event.keyCode === 13) {
            this.handleButtonClick();
        }
    }
    
    handleTextChange (event) {
        this.setState({ textInputStr: event.target.value });
    }
    
    componentDidUpdate () {
        var self = this;
        
        // Set the text value here to force the cursor to the end.
        if (this.state.textInputStr) {
            setTimeout(function () {
                if (self.$text) {
                    self.$text.val(self.state.textInputStr).focus();
                }
            }, 300);
        }
    
        // (re)set the timer to fade away.
        if (this.fadeAwayTimer) {
            clearTimeout(this.fadeAwayTimer);
            this.fadeAwayTimer = setTimeout(function () {
                self.handleCloseModal();
            }, 3000);
        }
    }
    
    componentWillUpdate (nextProps, nextState) {

        // Set the actual fadeAway based on caller-specified fadeAway & severity
        if (nextState.fadeAway !== this.state.fadeAway) {
            this.fadeAwayTimer = nextState.fadeAway;
        } else {
            this.fadeAwayTimer = (
        
                // Fade away on info and warn messages, unless they contain
                // inputs or links.
                (nextState.severity === 'info' ||
                nextState.severity === 'warn') &&
                !nextState.textInputStr &&
                !nextState.link
            );
        }
    }

    renderLink (promptStr) {
        
        // Build the link and maybe set the text displayed over it.
        var link = null,
            linkStr = null;
        
        if (this.state.link) {
            linkStr = (this.state.linkStr) ?
                this.state.linkStr : this.state.link;
        
            promptStr += ' ';
            link = (
                <a
                    href = {this.state.link}
                    target = '_blank'
                >
                    {linkStr}
                </a>
            );
        }
        return { link, promptStr };
    }

    renderTextInput (self) {
    
        // Build the text box and its OK button..
        var button = null,
            input = null;
        if (this.state.textInputStr) {
            input =
                <input
                    type = 'text'
                    onKeyPress = {self.handleTextKeyPress}
                    onChange = {self.handleTextChange}
                    ref={(input) => { this.$text = $(input); }}
                />,
            button = <button onClick = {function (event) {
                self.handleButtonClick(event);
            }}>
                OK
            </button>
            ;
        }
        return { input, button };
    }
    
    render () {

        // Only show when isOpen state is true.
        if (!this.state.isOpen) {
            return null;
        }

        // Log a console message if requested.
        if (this.state.logStr) {
            console.log(this.state.logStr);
        }
        
        var self = this,
            promptStr = this.state.promptStr,
            linkPromptStr = this.renderLink(promptStr),
            link = linkPromptStr.link,
            inputButton = this.renderTextInput(self),
            input = inputButton.input,
            button = inputButton.button,
            contentClass = (this.state.contentClass) ?
                this.state.contentClass : '',
            title = (this.state.severity === 'error') ? 'Error': null;
        
        promptStr = linkPromptStr.promptStr;
    
        return (
            <Modal
                isOpen = {this.state.isOpen}
                onRequestClose = {self.handleCloseModal}
                closeTimeoutMS = {(self.fadeAwayTimer) ? 1000 : 0}
                parentSelector = {this.parentSelector}
                overlayClassName = 'promptOverlay'
                className = {this.modalClass + ' ' + this.state.severity}
                title = {title}
                body = {
                    <div>
                        <div
                            className = {'modalLabel ' + contentClass}
                        >
                            {promptStr}
                            {link}
                        </div>
                        {input}
                    </div>
                }
                buttons = {button}
            />
        );
    }
}

Prompt.propTypes = {

    // The text to display as a prompt.
    promptStr: PropTypes.string.isRequired,

    // The type of prompt to control color and more.
    severity: PropTypes.oneOf(['info', 'warn', 'error']),
 
    // An http link to display just after the prompt string.
    link: PropTypes.string,
    
    // The text to display for the link.
    linkStr: PropTypes.string,
    
    // The default text to display in the text input box.
    textInputStr: PropTypes.string,

    // Fade away the modal after so many seconds of display. The default
    // is false, except for info and warning messages, the default is true.
    fadeAway: PropTypes.bool,
    
    // A class to attach to the prompt content.
    contentClass: PropTypes.string,

    // Function to call upon modal close.
    closeHandler: PropTypes.func,
};

Prompt.defaultProps = {
    // none
};

