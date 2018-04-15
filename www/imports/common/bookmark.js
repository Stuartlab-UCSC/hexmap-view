// bookmark.js
// Write and load persistent state

import React, { Component } from 'react';
import { render } from 'react-dom';

import Modal from '/imports/component/Modal';
import state from '/imports/common/state';
import userMsg from '/imports/common/userMsg';

import '/imports/common/navBar.html';
import '/imports/mapPage/init/mapPage.html';

var modal;

class BookmarkModal extends Component {
    constructor (props) {
        super(props);
        this.state = props;
        
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }
    
    handleCloseModal () {
        this.setState({ isOpen: false });
    }
    
    copyToClipboard(text) {
        var dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute('value', text);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }
    
    handleButtonClick () {
        this.copyToClipboard(this.a.innerHTML);
    }
  
    render () {

        // Only show when isOpen prop is true.
        if (!this.state.isOpen) {
            return null;
        }
        
        var self = this,
            button =
                <button
                    onClick = {self.handleButtonClick}
                    className = 'defaultButton'
                >
                    Copy to Clipboard
                </button>,
            style = {
                fontSize: '0.8em',
                wordWrap: 'break-word',
                wordBreak: 'break-all',
            };

        return (
            <Modal
                isOpen = {self.state.isOpen}
                onRequestClose = {self.handleCloseModal}
                className = 'bookmarkModal'
                body = {
                    <div>
                        <div>
                            Bookmark created:
                        </div>
                        <a
                            href = {self.state.link}
                            target = '_blank'
                            className = 'bookmarkLink'
                            style={style}
                            ref={(a) => { this.a = a; }}
                        >
                            {self.state.link}
                        </a>
                    </div>
                }
                buttons = {button}
            />
        );
    }
}

exports.load = function (bookmark, loadFx) {

    // Load state from the given bookmark.
    Meteor.call('findBookmark', bookmark,
        function (error, result) {
            if (error) {
                userMsg.error(error.string());
                return;
            }                
            if (result === 'Bookmark not found') {
                userMsg.error(result);
                return;
            }
            loadFx(result);
        }
    );
};

function createModal (link) {
    if (!modal) {
        modal = render(
            <BookmarkModal
            />, document.getElementById('bookmarkModalWrap')
        );
    }
    modal.setState({
        link: link,
        isOpen: true,
    });
}

function createBookmark () {

    // Create a bookmark of the current view for later retrieval.
    Meteor.call('createBookmark', state.saveEach(),
        function (error, result) {
            if (error) {
                userMsg.error('Sorry, bookmark could not be created due' +
                    ' to error: ' + error);
            } else {
                createModal(result);
            }
        }
    );
}

Template.mapPage.onRendered(function () {
    $('body').on('click', '.bookmark', createBookmark);
});
