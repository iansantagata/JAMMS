module.exports = function(grunt)
{
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json")
    });

    // Load Plugins
    grunt.loadNpmTasks("");

    // Default Tasks
    grunt.registerTask("default", [""]);
};
