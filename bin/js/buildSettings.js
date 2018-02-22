

console.log("Building 'config/settings.json' file from environment variables");
// Reads from environment (config file) and builds a settings.json
// file for meteor.
const HEXMAP = process.env.HEXMAP,
    DEV = process.env.DEV,
    URL_BASE = process.env.URL_BASE,
    HUB_URL = process.env.HUB_URL,
    VIEW_DIR = process.env.VIEW_DIR,
    ADMIN_EMAIL = process.env.ADMIN_EMAIL,
    SERVER_DIR = process.env.SERVER_DIR;
 
var settingsJson = {
    "public": {
        "DEV": (DEV == 'true'),
        "URL_BASE": URL_BASE,
        "HUB_URL": HUB_URL,
        "VIEW_DIR": VIEW_DIR,
        "ADMIN_EMAIL": ADMIN_EMAIL,
    },
    "server": {
        "SERVER_DIR": SERVER_DIR,
    }
};

var fs = require('fs');

fs.writeFileSync(
    HEXMAP.concat("/config/settings.json"),
    JSON.stringify(settingsJson, null, 4)
);

