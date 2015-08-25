#!/usr/bin/env node

// httpd.js: a tiny http server

const PORT=8112;
var express = require('express'),
    https = require('https'),
    app = express();

// Prettify any json. Only in dev; spaces are auto-removed in production.
app.set('json spaces');

// should do this for every request:
app.use(function (req, res, next) {
    var date = new Date(),
        stamp = date.getDate() + ':'
            + date.getHours() + ':'
            + date.getMinutes() + ':'
            + date.getSeconds();
    console.log('%s %s %s %s', stamp, req.method, req.url, req.path);
    next();
})

// Handle request for project data directories
app.get('/getProjDirs', function(req, res) {
    console.log('handling the /getProjDirs request');
    var fs = require("fs"),
        path = require("path"),
        projects = {},
        root = '.data',
        dirs = fs.readdirSync(root);

    dirs.forEach(function (user) {
        fullPath = root + '/' + user;
        if (fs.statSync(fullPath).isDirectory()) {
            projects[user] = [];
            userDirs = fs.readdirSync(fullPath);
            userDirs.forEach(function (dir) {
                var fullPath = root + '/' +  user + '/' + dir;
                if (fs.statSync(fullPath).isDirectory()) {
                    projects[user].push(dir);
                }
            });
        }
    });

    res.json(projects);
});


// Set the root for static files
app.use(express.static('./'));

console.log('listening on port ' + PORT);
app.listen(PORT);
// later, needs a certicate
//https.createServer({}, app).listen(PORT); // TODO later
