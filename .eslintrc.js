module.exports = {
    "globals": {
        "_": false,
        "ctx": true,
        "DEV": false,
        "HUB_URL": false,
        "layers": false,
        "PERFORM": false,
        "polygons": false,
        "rx": true,
        "VIEW_DIR": false,
    },
    "env": {
        "browser": true,
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
            "version": 6,
            "ignores": ["modules"]
        }],
        "semi": [
            "error",
            "always"
        ]
    }
};
