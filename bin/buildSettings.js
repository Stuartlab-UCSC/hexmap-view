

console.log("Building 'config/settings.json' file from environment variables");
// Reads from environment (config file) and builds a settings.json
// file for meteor.
const HEXMAP = process.env.HEXMAP,
    DEV = process.env.DEV,
    URL_BASE = process.env.URL_BASE,
    HUB_URL = process.env.HUB_URL,
    FEATURE_SPACE_DIR = process.env.FEATURE_SPACE_DIR,
    LAYOUT_INPUT_DIR = process.env.LAYOUT_INPUT_DIR,
    VIEW_DIR = process.env.VIEW_DIR,
    GOOGLE_API_KEY = process.env.GOOGLE_API_KEY,
    ADMIN_EMAIL = process.env.ADMIN_EMAIL,
    IS_CALC_SERVER = process.env.IS_CALC_SERVER,
    IS_MAIN_SERVER = process.env.IS_MAIN_SERVER,
    TEMP_DIR = process.env.TEMP_DIR,
    MAIN_MONGO_URL = process.env.MAIN_MONGO_URL,
    SERVER_DIR = process.env.SERVER_DIR;
 
var settingsJson = {
    "public": {
        "DEV": (DEV == 'true'),
        "URL_BASE": URL_BASE,
        "HUB_URL": HUB_URL,
        "FEATURE_SPACE_DIR": FEATURE_SPACE_DIR,
        "LAYOUT_INPUT_DIR": LAYOUT_INPUT_DIR,
        "VIEW_DIR": VIEW_DIR,
        "GOOGLE_API_KEY": GOOGLE_API_KEY,
        "ADMIN_EMAIL": ADMIN_EMAIL,
    },
    "server": {
        "jobs": {
            "IS_CALC_SERVER": (IS_CALC_SERVER == 'true'),
            "IS_MAIN_SERVER": (IS_MAIN_SERVER == 'true')
        },
        "TEMP_DIR": TEMP_DIR,
        "MAIN_MONGO_URL": MAIN_MONGO_URL,
        "SERVER_DIR": SERVER_DIR,
        "HUB_URL": HUB_URL,

    }
};

var fs = require('fs');
var mapManagerPortion = JSON.parse(
    fs.readFileSync(
        HEXMAP.concat("/config/mapManager.json"),
        'utf8'
    )
);


settingsJson["server"]["mapManagerHelper"] = mapManagerPortion;

fs.writeFileSync(
    HEXMAP.concat("/config/settings.json"),
    JSON.stringify(settingsJson, null, 4)
);

