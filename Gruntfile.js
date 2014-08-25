module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		library: grunt.file.readJSON('bower.json'),
		ngtemplates: {
			dist: {
				options: {
					url: function(url) { return url.replace('src/', ''); },
					module: 'ui.listInput',
					indentString: '\t'
				},
				src: ['src/{,**/}*.tpl.html'],
				dest: '.tmp/templates.js'
			}
		},
		concat: {
			options: {
				separator: ''
			},
			library: {
				src: [
					'src/list-input.js',
					'<%= ngtemplates.dist.dest %>'
				],
				dest: 'dist/<%= library.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			jid: {
				files: {
					'dist/<%= library.name %>.min.js': ['<%= concat.library.dest %>']
				}
			}
		},
		jshint: {
			beforeConcat: {
				src: [
					'Gruntfile.js',
					'src/**/*.js',
					'!src/**/*.spec.js'
				]
			},
			afterConcat: {
				src: [
					'<%= concat.library.dest %>'
				]
			},
			options: {
				// options here to override JSHint defaults
				globals: {
					module: true,
					angular: true
				},
				globalstrict: false,
				smarttabs: true
			}
		},
		ngmin: {
			lib: {
				src: ['<%= concat.library.dest %>'],
				dest: '<%= concat.library.dest %>'
			}
		},
		watch: {
			options: {
				livereload: 35735
			},
			files: [
				'Gruntfile.js',
				'src/**/*'
			],
			tasks: ['before-test', 'after-test']
		},
		bumpup: ['package.json', 'bower.json'],
		ngdocs: {
			options: {
				scripts: [
					'angular.js',
					'<%= concat.library.dest %>'
				],
				html5Mode: false
			},
			all: ['src/**/*.js']
		},
		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			watch: {
				background: true
			},
			continuous: {
				singleRun: true
			},
			travis: {
				singleRun: true,
				browsers: ['PhantomJS', 'Firefox']
			}
		},

		shell: {
			// Update package.json with latest versions
			npmBump: {
				command: './node_modules/npm-check-updates/bin/npm-check-updates -u'
			},

			// Update bower.json with latest versions
			bowerBump: {
				command: './node_modules/bower-update/bin/bower-update'
			}
		}
	});

	grunt.registerTask('before-test', ['ngtemplates', 'jshint:beforeConcat', 'concat']);
	grunt.registerTask('after-test', ['ngmin', 'jshint:afterConcat', 'uglify']);


	grunt.registerTask('default', ['before-test', 'test', 'after-test']);
	grunt.registerTask('livereload', ['before-test', 'after-test', 'watch']);
	grunt.registerTask('docs', ['before-test', 'after-test', 'ngdocs']);

	// Updates package.json and bower.json with latest versions of
	// dependencies
	grunt.registerTask('bumpDeps', [
		'shell:npmBump',
		'shell:bowerBump'
	]);

	grunt.registerTask('test', 'Run tests on singleRun karma server', function() {
		if (process.env.TRAVIS) {
			grunt.task.run('karma:travis');
		} 
		else {
			grunt.task.run('karma:continuous');
		}
	});
};