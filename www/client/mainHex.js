// mainHex.js

import { Meteor } from 'meteor/meteor';
import auth from '/imports/common/auth.js';
import mapPageInit from '/imports/mapPage/init/mapPageInit.js';
import perform from '/imports/common/perform.js';
import rx from '/imports/common/rx.js';
import rxInternal from '/imports/common/rxInternal.js';
import state from '/imports/common/state.js';
import userMsg from '/imports/common/userMsg';

// We need this order to retain the correct cascading effect.
import '/imports/lib/jquery-ui.css';
import '/imports/common/colorsFont.css';

if (Meteor.settings.public.DEV) {
    DEV = true; //development functionality will be included
} else {
    DEV = false;
}
VERSION = '1.0';

var unsubFx = {};

Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

// When the state has been loaded...
function isStateLoaded () {
    
    var R = rx.getState();
    if (R['inited.ctx'] &&
        R['inited.state']) {
        
        unsubFx.isStateLoaded();
        //perform.log('init:state-loaded');
        
        auth.init();

        if (Session.equals('page', 'mapPage')) {
            mapPageInit.init();
        } else if (Session.equals('page', 'homePage')) {
            import('/imports/homePage/home.js').then(home => home.init());
        }
    }
}

function defineEnvironment () {
    URL_BASE = Meteor.settings.public.URL_BASE;
    VIEW_DIR = Meteor.settings.public.VIEW_DIR;
    HUB_URL = Meteor.settings.public.HUB_URL;
    ctx = null; // The global client state
    layers = {}; // contains almost all information about attributes
    googlemap = null; // our main googlemap instance
    colormaps = {};
    polygons = {}; // Global: hold objects of polygons by signature name

    // Deny all client-side updates to user documents
    Meteor.users.deny({
        update() { return true; }
    });
}

Meteor.startup(() => {
    defineEnvironment();
    perform.init('render');
    rxInternal.init();
    userMsg.init();
    unsubFx.isStateLoaded = rx.subscribe(isStateLoaded);
    state.init();
    rx.set('inited.ctx');
});
