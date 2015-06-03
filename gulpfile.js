var gulp = require('gulp');

var runSequence = require('run-sequence');

var gulpUtils = require('@anyware/gulp-utils');

MINIMUM_CODE_COVERAGE = 90;

// Create shared tasks
require('@anyware/gulp-utils/tasks/test-task')(
  gulp,
  'test', // taskName
  'src/**/*.js', // filesToCover
  'test/**/*-test.js', // testFiles
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
  ["src/**/*.js", "test/**/*.js"] // files
);

gulp.task('default', function(callback) {
  return runSequence('lint', 'test', callback);
});


