module.exports = function(grunt)
{
    // Project Configuration
    grunt.initConfig(
    {
        pkg: grunt.file.readJSON("package.json"),
        copy:
        {
            main:
            {
                expand: true,
                flatten: true,
                dest: "public/external",
                cwd: "node_modules/",
                src:
                [
                    "jquery/dist/jquery.slim.min.*",
                    "bootstrap/dist/js/bootstrap.bundle.min.*",
                    "bootstrap/dist/css/bootstrap.min.*",
                    "bootstrap-icons/font/bootstrap-icons.css"
                ],
                filter: "isFile"
            },
            fonts:
            {
                expand: true,
                flatten: false,
                dest: "public/external",
                cwd: "node_modules/bootstrap-icons/font",
                src: "fonts/*",
                filter: "isFile"
            }
        }
    });

    // Load Plugins
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default Tasks
    grunt.registerTask("default", ["copy:main", "copy:fonts"]);
};
