module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
		    dist: {
		      src: ['js/vendor/*.js', 'js/*.js'],
		      dest: 'js/author/scripts.js',
		    },
		  },
		  uglify: {
			build: {
				options: {
			        sourceMap: true,
			        sourceMapName: 'js/scripts.js.map'
			      },
				src : 'js/author/scripts.js',
				dest : 'js/scripts.min.js',
			},
			
		  },
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify']);

};