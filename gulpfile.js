var gulp = require('gulp')
, browserify = require('gulp-browserify')
, reactify = require('reactify')
, uglify = require('gulp-uglify')
;

gulp.task('default', function() {
  // Single entry point to browserify
  gulp.src('./assets/browserify/lgtm.js')
    .pipe(browserify({
      transform: [reactify]
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./assets'))
});
