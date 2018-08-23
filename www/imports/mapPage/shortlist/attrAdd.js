
// addAttr.js
// This allows the user to add new dynamic attributes to the current map.

import React, { Component } from 'react';
import { render } from 'react-dom';
import DialogHex from '/imports/common/DialogHex';
import Layer from '/imports/mapPage/longlist/Layer';
import { ReadFile } from '/imports/component/ReadFile'
import rx from '/imports/common/rx';
import userMsg from '/imports/common/userMsg';

import '/imports/mapPage/shortlist/attrAdd.html';

var dialogHex = null;

function destroy() {

    dialogHex.hide();
    dialogHex = undefined;
}

addAsLayers = function (data) {
    
    // Load the data into the shortlist.

    // Find unique names for the attributes.
    var attrNames = _.map(data[0].slice(1), function (origName) {
            return Layer.make_unique_name(origName);
        }),
        dynLayers = {};
    
    // Create the basic layer entry.
    _.each(attrNames, function (name) {
        dynLayers[name] = { data: {}, dynamic: true };
    });
    
    // Load the values in each row.
    _.each(data.slice(1), function (row) {
        var nodeId = row[0];
        _.each(row.slice(1), function (val, i) {
            dynLayers[attrNames[i]].data[nodeId] = val;
        });
    });
    
    // Add all the layers to our layers global and the shortlist.
    Layer.with_many(attrNames, () => {
        rx.set('shortlist.addDynamicByAddAttr', { attrs: attrNames } )
    }, dynLayers);

    rx.set('attrAdd:adding.done');

    // Destroy this dialogHex.
    destroy();
};

function handleReadStart() {
    rx.set('attrAdd:adding.now');
}

function handleReadError(msg) {
    rx.set('attrAdd:adding.done');
    userMsg.error(msg);
}

export function create() {

    // Create the dialog.
    if (!dialogHex) {

    // Retrieve the html template.
    Blaze.render(Template.attrAddTemplate, $('.content')[0]);
    
    // Attach the html to the page content.
    let $dialog = $('#attrAddDialog');
    $('.content').append($dialog);
    
    // Attach the file reader
    render(
        <ReadFile
            parseTsv = {true}
            onSuccess = {addAsLayers}
            onStart = {handleReadStart}
            onError = {handleReadError}
        />, $dialog.find('.fileAnchor')[0]);

    // Create a dialog and show it.
    dialogHex = DialogHex.create({
        $el: $dialog,
        opts: { title: 'Add Color Attributes' },
        helpAnchor: '/help/addAttr.html',
    });
    }
    dialogHex.show();
}
