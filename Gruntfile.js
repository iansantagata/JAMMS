module.exports = function(grunt)
{
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        copy: {
            files: {
                expand: true,
                flatten: true,
                dest: "public/external",
                cwd: "node_modules/",
                src: "jquery/dist/jquery.min.js",
                filter: "isFile"
            }
        }
    });

    // Load Plugins
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default Tasks
    grunt.registerTask("default", ["copy"]);
};
