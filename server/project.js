
// project.js

var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');

var majors;
var projects = {};
var dataDir = DATA_DIR + 'data/';

function isDataDir (entry, major) {

    // Determine if an entry is a directory
    var future = new Future();
    var path = dataDir + (major ? major + '/' : '') + entry;
    
    // First find the stats on this path
    fs.stat(path, function (error, fsStats) {
        if (error) {
            future.throw(error);
        } else {
        
            // Return the directory status of this path
            future.return(fsStats.isDirectory());
        }
    });
    return future.wait();
}

getDataDirs = function (major) {

    var dirs = getAllData(major);
    
    // Remove any files and hidden dirs
    return _.filter(dirs, function (dir) {
        return (dir.indexOf('.') !== 0) && isDataDir(dir, major);
    });
}

function getAllData (major) {

    // Retrieve data directories
    var future = new Future(),
        dir = dataDir + ((_.isUndefined(major)) ? '' : major);
    
    fs.readdir(dir, function (error, results) {
        if (error) {
            future.throw(error);
        } else {
            future.return(results);
        }
    });
    return future.wait();
}

function getMinors (majorIndex) {

    // Get one major's minor directory names
    var major = majors[majorIndex];
    var minors  = getDataDirs(major);
    
    if (_.isUndefined(minors)) return;

    // Save the major's minors to our projects object
    projects[major] = minors;
    
    if (majorIndex < majors.length - 1) {

        // Go get the next major's minors
        getMinors(majorIndex + 1);
    } else {

        // We've got all the minors, so we're done
        return;
    }
}

getProjectRole = function (major) {

    var meta,
        filename = dataDir + major + '/meta.json';
    
    if (fs.existsSync(filename)) {
        meta = readFromJsonFileSync(filename);
        if (meta && meta.role) {
            return meta.role;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

function getMajors () {

    // Get the major directory names
    var user = Meteor.user();
    var projects = {};
    var majors1 = getDataDirs();
    
    // There are no projects at all.
    if (_.isUndefined(majors1)) return;
    
    // Remove any projects for which this user is not authorized
    majors = []
    _.each(majors1, function(major) {
        var role = getProjectRole(major);
           
        // Don't include those without a role, or if the user is not in that role
        if (isUserInRole(user, role)) {
            majors.push(major);
        }
    });
    
    // Get the minor projects of each major.
    if (majors.length > 0) {
        getMinors(0);
    }
}

Meteor.methods({

    getProjects: function () {
        getMajors();
        return projects;
    },
    
});
