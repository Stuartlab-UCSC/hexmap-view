var exec = Npm.require('child_process').exec;
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');

Meteor.methods({

    statsSortLayoutLayer: function (layer_name, layerIndex, layout, directory) {
        this.unblock();
        var future = new Future();
        var command = 'python /Users/swat/dev/hexagram/server/statsSortLayoutLayer.py '
            + layer_name + ' '
            + layerIndex + ' '
            + layout + ' '
            + directory;
        exec(command, function(error, stdout, stderr) {
            if (error){
                console.log(error);
                throw new Meteor.Error(500, command + " failed");
            }
            future.return(stdout.toString());
        });
        return future.wait();
    },
});