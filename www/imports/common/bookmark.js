// bookmark.js
// An object to write and load state

import DialogHex from '/imports/common/DialogHex';
import state from '/imports/common/state';
import tool from '/imports/mapPage/head/tool';
import userMsg from '/imports/common/userMsg';
import '/imports/common/navBar.html';

var bookmarkMessage = new ReactiveVar(),
    bookmarkColor = new ReactiveVar('black'),
    bookmarkDialogHex;

Template.bookmarkT.helpers ({
    message: function () {
        return bookmarkMessage.get();
    },
    color: function () {
        return bookmarkColor.get();
    },
});

function createBookmark () {

    // Create a bookmark of the current view for later retrieval.
    bookmarkMessage.set('Creating bookmark...');
    bookmarkColor.set('black');
    
    Meteor.call('createBookmark', state.saveEach(), function (error, result) {
        if (error) {
            bookmarkMessage.set('Sorry, bookmark could not be created due' +
                ' to error: ' + error);
            bookmarkColor.set('red');
        } else {
            bookmarkMessage.set(result);
            
            // Wait for the message to be applied to the input element
            // before selecting the entire string
            Meteor.setTimeout(function () {
                document.querySelector('#bookmarkDialog .message')
                    .setSelectionRange(0, result.length);
            },0);
        }
    });
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

function closeBookmark () {
    bookmarkDialogHex.hide();
}

exports.init = function () {

    // Create an instance of DialogHex
    bookmarkDialogHex = DialogHex.create({
        $el: $('#bookmarkDialog'),
        opts: {
            title: 'Bookmark',
            position: { my: "left", at: "left+20", of: window },
            close: closeBookmark,
        },
        showFx: createBookmark,
    });

    // Listen for the 'create bookmark' menu clicked
    tool.add("bookmark", function () { bookmarkDialogHex.show(); },
        'Access this view later by creating a bookmark');
};

