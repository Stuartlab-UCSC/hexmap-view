// serverAndClient.js
// globals for client and server


    // Some global settings available to server and client.
    // Enable performance metric collection.
    VERSION = '1.0';
    URL_BASE = Meteor.settings.public.URL_BASE;
    VIEW_DIR = Meteor.settings.public.VIEW_DIR;
    HUB_URL = Meteor.settings.public.HUB_URL;

    if (Meteor.settings.public.DEV) {//no booleans with strict JSON
        DEV = true; //development functionality will be included
    } else {
        DEV = false;
    }

Meteor.startup( () => {

    if (Meteor.isClient) {
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

    if (Meteor.isServer) {
    
        // Allow content from anywhere
        var all = '*:*';
        //var kolossus = '*.kolossus.sdsc.edu:*';

        BrowserPolicy.content.allowOriginForAll(all);
        
        // We must allow use of evil eval in javascript for google charts.
        BrowserPolicy.content.allowEval();
            
        // Allow content sniffing by google analytics
        //BrowserPolicy.content.allowContentTypeSniffing();

        // From the settings.json file.
        SERVER_DIR = Meteor.settings.server.SERVER_DIR;
        ADMIN_EMAIL = Meteor.settings.public.ADMIN_EMAIL;
        
        Accounts.emailTemplates.from = ADMIN_EMAIL;
        Accounts.emailTemplates.siteName = 'tumorMap.ucsc.edu';

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
});
