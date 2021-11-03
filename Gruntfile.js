"use strict";

module.exports = function(grunt)
{
    // Project Configuration
    grunt.initConfig({
        clean:
        {
            external:
            {
                src: "public/external/*"
            }
        },
        copy:
        {
            files:
            {
                cwd: "node_modules/",
                dest: "public/external",
                expand: true,
                filter: "isFile",
                flatten: true,
                nonull: true,
                src:
                [
                    "jquery/dist/jquery.slim.min.*",
                    "bootstrap/dist/js/bootstrap.bundle.min.*",
                    "bootstrap/dist/css/bootstrap.min.*",
                    "bootstrap-icons/font/bootstrap-icons.css"
                ]
            },
            fonts:
            {
                cwd: "node_modules/bootstrap-icons/font",
                dest: "public/external",
                expand: true,
                filter: "isFile",
                flatten: false,
                nonull: true,
                src: "fonts/*"
            }
        },
        pkg: grunt.file.readJSON("package.json")
    });

    // Load Plugins
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default Tasks
    grunt.registerTask("default", ["clean:external", "copy:files", "copy:fonts"]);
};
