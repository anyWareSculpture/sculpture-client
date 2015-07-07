var path = require('path');

var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require("babelify");
var through = require('through2');
var runSequence = require('run-sequence');

var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var shell = require('gulp-shell');

var gulpUtils = require('@anyware/gulp-utils');

var MINIMUM_CODE_COVERAGE = 90;
var BUILD_DIRECTORY = 'build';

// Create shared tasks
require('@anyware/gulp-utils/tasks/test-task')(
  gulp,
  'test', // taskName
  'app/src/**/*.js', // filesToCover
  'app/test/**/*-test.js', // testFiles
  process.env.TRAVIS ? 'spec' : 'nyan', // reporter
  MINIMUM_CODE_COVERAGE // minimumCodeCoverage
);
require('@anyware/gulp-utils/tasks/submit-coverage-task')(
  gulp,
  'submit-coverage' // taskName
);
require('@anyware/gulp-utils/tasks/lint-task')(
  gulp,
  'lint', // taskName
  ["app/**/*.js"] // files
);

gulp.task('default', function(callback) {
  return runSequence('lint', 'test', 'build', 'package', callback);
});

gulp.task('build', ['build-app', 'collect-static', 'collect-manifest', 'collect-pages', 'collect-scripts']);

gulp.task('build-app', function buildApp() {
  var browserified = through.obj(function(file, enc, next) {
    browserify(file.path, {
      debug: true,
    }).transform(babelify.configure({
      stage: 0
    })).bundle(function(err, res){
      // assumes file.contents is a Buffer
      if (err) {
        throw err;
      }
      file.contents = res;
      next(null, file);
    });
  });

  return gulp.src(['app/src/index.js'])
    .pipe(browserified)
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(concat('application.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(BUILD_DIRECTORY));
});

gulp.task('package', function packageTask() {
  return gulp.src('build/**/*')
        .pipe(zip('anyware-sculpture.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('collect-static', function collectStatic() {
  return gulp.src('static/**/*')
    .pipe(gulp.dest(path.join(BUILD_DIRECTORY, 'static')));
});

gulp.task('collect-manifest', function collectManifest() {
  return gulp.src('manifest.json')
    .pipe(gulp.dest(BUILD_DIRECTORY));
});

gulp.task('collect-pages', function collectPages() {
  return gulp.src('app/**/*.html')
    .pipe(gulp.dest(BUILD_DIRECTORY));
});

gulp.task('collect-scripts', function collectPages() {
  return gulp.src('scripts/**/*.js')
    .pipe(gulp.dest(BUILD_DIRECTORY));
});

gulp.task('launch', shell.task([
  'google-chrome --load-and-launch-app=$PWD/build'
]));

