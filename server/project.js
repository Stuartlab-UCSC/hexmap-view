
// project.js

var fs = Npm.require('fs');

var majors;
var projects = {};
var dataDir = VIEW_DIR;

function isDataDir (entry, major) {

    // Determine if an entry is a directory
    var isDir = false,
        fsStats,
        path = dataDir + (major ? major + '/' : '') + entry;
    
    // Find the stats on this path
    try {
        fsStats = fs.statSync(path);
        
    } catch (error) {
        console.log('Error on fs.statSync in isDataDir(', entry, ',', major, ',', path, '):', error);
        return false;
    }
    
    try {
        isDir = fsStats.isDirectory();
        
    } catch (error) {
        console.log('Error on fsStats.isDirectory in isDataDir(', entry, ',', major, '):', error);
        return false;
    }
    return isDir;
}

getDataDirs = function (major) {

    //console.log(major)
    var dirs = getAllData(major);

    // Remove any files and hidden dirs
    return _.filter(dirs, function (dir) {
        return (dir.indexOf('.') !== 0) && isDataDir(dir, major);
    });
}

function getAllData (major) {

    // Retrieve data directories
    var results,
        dir = dataDir + ((_.isUndefined(major)) ? '' : major);
    
    try {
        results = fs.readdirSync(dir);
    } catch (error) {
        console.log('Error on getAllData(', major, ',', dir, '):', error);
        console.trace()
        results = undefined;
    }
    return results;
}

function getMinors (majorIndex) {

    // Get one major's minor directory names
    var major = majors[majorIndex];
    var minors  = getDataDirs(major);
    
    // This is a single-level project, so save an empty list of sub-projects
    if (_.isUndefined(minors)) {
        minors = [];
    }

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
    projects = {};
    var user = Meteor.user();
    var majors1 = getDataDirs();
    
    // There are no projects at all.
    if (_.isUndefined(majors1)) return;
    
    // Exclude any projects for which this user is not authorized
    majors = []
    _.each(majors1, function(major) {
        var role = getProjectRole(major);
           
        // Authorize depending on user and her role.
        if (isUserAuthorized(user, role)) {
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

    //getMinorProjects: function() {

    //}
    
});
