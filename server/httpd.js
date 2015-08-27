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
    next();  // move on to the next URL handler
})

function getProjDirs(req, res) {
    console.log('handling the /getProjDirs request');
    var fs = require("fs"),
        path = require("path"),
        projects = {},
        root = 'hex/.data', // 
        //root = '/hex/.data', // no such file on su2c-dev hexProxy/hex
        //root = '.data', // works on localhost:8112
        dirs = fs.readdirSync(root);

    console.log('dirs', dirs);

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
    console.log('projects', projects);
    res.json(projects);
}

// Handle requests for project data directories
app.get('/getProjDirs/', getProjDirs); // without an httpd proxy
app.get('/hex/getProjDirs/', getProjDirs); // su2c-dev:hexProxy/hex
app.get('/hex/hex-me/getProjDirs/', getProjDirs); // su2c-dev:hexProxy/hex/hex-me
app.get('/hex/hex-stats/getProjDirs/', getProjDirs); // su2c-dev:hexProxy/hex/hex-stats

// Set the root for static files
app.use(express.static('./'));

console.log('listening on port ' + PORT);
app.listen(PORT);
// later, needs a certicate
//https.createServer({}, app).listen(PORT); // TODO later
