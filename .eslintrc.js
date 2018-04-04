module.exports = {

    // Use false for immutable vars and true for mutable.
    "globals": {
        "_": false,
        "ctx": true,
        "ADMIN_EMAIL": false,
        "DEV": false,
        "GoogleMaps": false,
        "google": false,
        "googlemap": true,
        "HUB_URL": false,
        "layers": false,
        "PERFORM": false,
        "polygons": false,
        "Roles": false, // this shouldn't need to be here
        "sendMail": false, // where is this defined?
	"URL_BASE": false,
        "VERSION": false,
        "VIEW_DIR": false,
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
