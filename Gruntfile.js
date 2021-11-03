module.exports = function(grunt)
{
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        copy: {
            files: {
                expand: true,
                flatten: true,
                dest: "",
                cwd: "",
                src: "",
                filter: "isFile"
            }
        }
    });

    // Load Plugins
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default Tasks
    grunt.registerTask("default", ["copy"]);
};
