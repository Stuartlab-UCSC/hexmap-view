// serverAndClient.js
// globals for client and server

if (Meteor.isClient) {
    ctx = null; // The global client state
    layers = {}; // contains almost all information about attributes
    googlemap = null; // our main googlemap instance
    colormaps = {};
}

Meteor.startup( () => {
    if (Meteor.isServer) {
    
        // Allow content from the hub and google
        // TODO make hub variable
        var kolossus = '*.kolossus.sdsc.edu:*';
        var google = '*.google.com';
        var googleStatic = '*.gstatic.com';
        var googleAnalytics = '*.google-analytics.com';
        var googleApi = '*.googleapis.com';
        
        BrowserPolicy.content.allowSameOriginForAll(kolossus);
        BrowserPolicy.content.allowDataUrlForAll(kolossus);
        BrowserPolicy.content.allowOriginForAll(kolossus);
        BrowserPolicy.content.allowConnectOrigin(kolossus);
        
        BrowserPolicy.content.allowOriginForAll(google);
        BrowserPolicy.content.allowOriginForAll(googleStatic);
        BrowserPolicy.content.allowOriginForAll(googleAnalytics);
        BrowserPolicy.content.allowOriginForAll(googleApi);
            
        // Allow content sniffing by google analytics
        //BrowserPolicy.content.allowContentTypeSniffing();
        
        // Allow use of eval in javascript
        BrowserPolicy.content.allowEval();
    }
});

if (Meteor.isServer) {

    SERVER_DIR = Meteor.settings.server.SERVER_DIR;
    TEMP_DIR = Meteor.settings.server.TEMP_DIR;
    IS_MAIN_SERVER = Meteor.settings.server.jobs.IS_MAIN_SERVER;
    IS_CALC_SERVER = Meteor.settings.server.jobs.IS_CALC_SERVER;
    MAIN_MONGO_URL = Meteor.settings.server.jobs.MAIN_MONGO_URL;
    ADMIN_EMAIL = Meteor.settings.public.ADMIN_EMAIL;

    var exec = Npm.require('child_process').exec;
    var process = Npm.require('process');
    
    sendMail = function (users, subject, msg, callback) {

        // Send mail to user(s) with the given subject and message.
        // This can take one username or an array of usernames.
        var command =
            'echo "'
            + msg
            + '" | '
            + 'mail -s "'
            + subject
            + '" -S from="'
            + ADMIN_EMAIL
            + '" '
            + users.toString();
        
        console.log('sendMail():', command);
        
        // Don't send from localhost, macOS mail doesn't support the 'from' option.
        if (URL_BASE.indexOf('localhost') > -1) return;
        
        exec(command, function (error, stdout, stderr) {
            if (error) {
                var errMsg = 'Error on sendMail(): ' + error;
                console.log(errMsg);
                if (callback) { callback(errMsg); }
            } else {
                if (callback) { callback(); }
            }
        });
    }
}
// Some global settings available to server and client.
URL_BASE = Meteor.settings.public.URL_BASE;
VIEW_DIR = Meteor.settings.public.VIEW_DIR;
LAYOUT_INPUT_DIR = Meteor.settings.public.LAYOUT_INPUT_DIR;
FEATURE_SPACE_DIR = Meteor.settings.public.FEATURE_SPACE_DIR;
GOOGLE_API_KEY = Meteor.settings.public.GOOGLE_API_KEY;
HUB_URL = Meteor.settings.public.HUB_URL;

if (Meteor.settings.public.DEV) {//no booleans with strict JSON
    DEV = true; //development functionality will be included
} else {
    DEV = false;
}

/*
// Deny all client-side updates to user documents
Meteor.users.deny({
  update() { return true; }
});
*/
