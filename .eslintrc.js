module.exports = {

    // Use false for immutable vars and true for mutable.
    "globals": {
        "_": false,
        "colormaps": true,
        "ctx": true,
        "ADMIN_EMAIL": true,
        "DEV": true,
        "exec": true,
        "GoogleMaps": false,
        "google": false,
        "googlemap": true,
        "HUB_URL": true,
        "layers": true,
        "PERFORM": false,
        "polygons": true,
        "process": true,
        "Roles": false, // this shouldn't need to be here
        "sendMail": false, // where is this defined?
	"URL_BASE": true,
        "VERSION": true,
        "VIEW_DIR": true,
    },
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "jquery": true,
        "meteor": true,
        "mongo": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:node/recommended",
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "allowImportExportEverywhere": true,
        "ecmaVersion": 2018,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "node",
        "react",
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-console": 0,
        "node/exports-style": [
            "error",
            "exports",
        ],
        "node/no-unsupported-features": ["error", {
            "version": 8,
            "ignores": ["modules"]
        }],
        "semi": [
            "error",
            "always"
        ]
    }
};
