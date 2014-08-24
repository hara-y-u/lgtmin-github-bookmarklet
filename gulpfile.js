var gulp = require('gulp')
, browserify = require('gulp-browserify')
, reactify = require('reactify')
, uglify = require('gulp-uglify')
, stylus = require('gulp-stylus')
, nib = require('nib')
, jeet = require('jeet')
;

gulp.task('browserify', function() {
  gulp.src('./assets/src/browserify/lgtm.js')
    .pipe(browserify({
      transform: [reactify]
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./assets'))
});

gulp.task('stylus', function() {
  gulp.src('./assets/src/app.styl')
    .pipe(stylus({use: [nib(), jeet()]}))
    .pipe(gulp.dest('./assets'));
});

gulp.task('default', ['browserify', 'stylus']);
