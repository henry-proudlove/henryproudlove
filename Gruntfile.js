module.exports = function(grunt) {
	var jsSrc = ['js/vendor/froogaloop.min.js',
			'js/vendor/viewport-units-buggyfill.js',
       	 	'js/vendor/jquery.cycle2.js',
        	'js/vendor/jquery.cycle2.swipe.min.js',
        	'js/author/plugins.js',
        	'js/author/main.js']
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
		    dist: {
		      src: jsSrc,
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