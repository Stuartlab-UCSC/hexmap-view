
// Notify.js
// Handle notifications to user via a column of messages.
// Thanks to https://github.com/igorprado/react-notification-system.

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './notify.css';

export default class Notify extends Component {

    constructor() {
        super();
        this.wasMounted = true;
        this.state = {};
        
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.timerToHide = this.timerToHide.bind(this);
        this.closeMessage = this.closeMessage.bind(this);
    }

    componentWillUnmount() {
        this.wasMounted = false;
    }

    componentDidUpdate(prevProps, prevState) {
    
        const self = this,
    
            // Find keys in the current state
            // that were not present in the previous state.
            newKeys = _.difference(
                Object.keys(this.state), Object.keys(prevState));
        
        // State only contains messages, so these keys identify messages.
        if (newKeys !== undefined) {
            _.each(newKeys, function (key) {
                const time = self.state[key].time;
                if (time) {
                    self.timerToHide(time, key);
                }
            });
        }
    }

    timerToHide(time, key) {
        const self = this;
        setTimeout(() => {
            self.closeMessage(key);
        }, time);
    }

    closeMessage(key) {
        if (!this.wasMounted) {
            return;
        }
        
        // Callback if there is one.
        if (this.state[key].callback) {
            this.state[key].callback();
        }
        
        // Remove this message.
        this.setState((state) => {
            delete state[key];
            return state;
        });
    }
    
    renderLink (link, linkText) {
        if (!link) {
            return null;
        }

        // Build the link and maybe set the text displayed over it.
        return (
            <a
                href = {link}
                target = '_blank'
                className = 'notify-link'
            >
                {linkText ? linkText : link}
            </a>
        );
    }
    
    renderText(msg) {
        if (!msg) {
            return null;
        }

        // Convert any single string msg to an array of one msg and treat
        // each element in the array as one paragraph.
        var msgArray = (typeof msg === 'string') ? [msg] : msg;
        
        return msgArray.map((str, i) =>
            <p
                className = "notify-body"
                key = {i}
            >
                {str}
            </p>
        );
    }

    renderMessage(self, key) {
        const { severity, msg, link, linkText } = this.state[key],
        
            // The title gets set only for errors.
            title = severity === 'error' ?
                <p className = 'notify-title'> Error </p> : null;

        return (
            <div key={key} className={`notify-message ${severity}`}
                onClick={() => self.closeMessage(key)}>
                {title}
                {this.renderText(msg)}
                {this.renderLink(link, linkText)}
            </div>
        );
    }

    render() {
        const { state } = this;
        const keys      = Object.keys(state);
        const el        = keys.map((key) => this.renderMessage(self, key));

        return <div className="notify-list">{el}</div>;
    }
}

Notify.propTypes = {

    // Text to show in the message; either a string
    // or an array of strings, one per paragraph.
    msg: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.array.isRequired
    ]),
    
    // Level of severity, one of [error, info, warn].
    severity: PropTypes.string,
    
    // http link to appear after the message.
    link: PropTypes.string,

    // Text to appear instead of actual link.
    linkText: PropTypes.string,
    
    // Visibility of this component, passed thru to ReactModal.
    isOpen: PropTypes.bool,
    
    // Function to call when a modal is closed.
    // Pass-thru to react-modal.
    callback: PropTypes.func,
    
    // Milliseconds before closing the message,
    // where zero, null or undefined indicates don't close it automatically.
    time: PropTypes.number,
};

Notify.defaultProps = {
    severity: 'info',
    isOpen: true,
};


