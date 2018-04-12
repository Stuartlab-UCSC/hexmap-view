// mainHex.js

import { Meteor } from 'meteor/meteor';
import auth from '/imports/common/auth.js';
import mapPageInit from '/imports/mapPage/init/mapPageInit.js';
import navBar from '/imports/common/navBar.js';
import perform from '/imports/common/perform.js';
import rx from '/imports/common/rx.js';
import rxInternal from '/imports/common/rxInternal.js';
import state from '/imports/common/state.js';
import userMsg from '/imports/common/userMsg';

// We need this order to retain the correct cascading effect.
import '/imports/lib/jquery-ui.css';
import '/imports/common/colorsFont.css';
import '/imports/common/navBar.css';

var unsubFx = {};

Template.body.helpers({
    page: function () {
        return Session.get('page');
    },
});

// When the state has been loaded...
function isStateLoaded () {
    
    var R = rx.getState();
    if (R['init.ctxLoaded'] &&
        R['init.stateLoaded']) {
        
        unsubFx.isStateLoaded();
        perform.log('init:state-loaded');
        
        auth.init();
        navBar.init();

        if (Session.equals('page', 'mapPage')) {
            mapPageInit.init();
        } else if (Session.equals('page', 'homePage')) {
            import('/imports/homePage/home.js').then(home => home.init());
        }
    }
}

Meteor.startup(() => {
    perform.init();
    rxInternal.init();
    userMsg.init();
    unsubFx.isStateLoaded = rx.subscribe(isStateLoaded);
    state.init();
    rx.set('init.ctxLoaded');
});
