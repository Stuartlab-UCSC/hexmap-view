
// project.js

var fs = Npm.require('fs');
var Future = Npm.require('fibers/future');

var url = Meteor.absoluteUrl();
var dataDir;
if (url === 'http://localhost:3000/') {

    // Localhost development
    dataDir = '/Users/swat/';
} else if (url.search('hexmap.sdsc.edu') > -1) {

    // Production
    dataDir = '/data/';
} else {

    // Development
    dataDir = '/cluster/home/swat/';
}

var majors,
    projects = {};

function removeHiddenDirs (dirs) {
    return _.filter(dirs, function (dir) {
        return (dir.indexOf('.') !== 0);
    });
}

function isDataDir (entry) {

    // Determine if an entry is a directory
    var future = new Future();
    var path = dataDir + entry;
    
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

function removeFile (majorIndex, minorIndex) {

    // Remove the non-directories from the projects' minor lists
    // The major's list is assumed to be all directories
    var major = majors[majorIndex];

    if (!major) {

        // We've processed all the entries, so just return.
        return;
    }

    var minor = projects[major][minorIndex];
    if (!minor) {

        // There are no more minors for this major,
        // so process the next major's first minor entry.
        removeFile(majorIndex + 1, 0);
        return;
    }

    var entry = 'data/' + major + '/' + minor;

    var isDir = isDataDir(entry);
    if (_.isUndefined(isDir)) return;

    // Remove the minor if it is not a directory
    if (!isDir) {
        projects[major].splice(minorIndex, 1);
        minorIndex -= 1;
    }
        
    // Process the major's next minor entry
    removeFile(majorIndex, minorIndex + 1);
}

function getDataDirs (major) {

    // Retrieve data directories
    var future = new Future(),
        dir = dataDir + 'data/' + ((_.isUndefined(major)) ? '' : major);
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
    var minors = getDataDirs(majors[majorIndex]);
    if (_.isUndefined(minors)) return;

    // Save the major's minors to our projects object
    projects[majors[majorIndex]] = removeHiddenDirs(minors);
    if (majorIndex < majors.length - 1) {

        // Go get the next major's minors
        getMinors(majorIndex + 1);
    } else {

        // We've got all the minors, so remove any entries that
        // are a file rather than a directory
        removeFile(0, 0);
    }
}

function getProjectRole (major) {

    var meta,
        filename = dataDir + 'data/' + major + '/meta.json';
    
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
    projects = {};
    var majors1 = getDataDirs();
    
    // There are no projects at all.
    if (_.isUndefined(majors1)) {
        return;
    }

    // Save the major projects array
    majors1 = removeHiddenDirs(majors1);
    if (majors1.length < 1) {
        return;
    }
        
    // Remove any projects for which this user is not authorized
    majors = []
    _.each(majors1, function(major) {
        var role = getProjectRole(major);
        
        // Don't include those without a role, or if the user is not in that role
        if (role && (role === 'public' || (user && Roles.userIsInRole(user, role)))) {
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
