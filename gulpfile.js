var gulp = require('gulp')
, browserify = require('gulp-browserify')
, reactify = require('reactify')
;

gulp.task('default', function() {
  // Single entry point to browserify
  gulp.src('./assets/browserify/lgtm.js')
    .pipe(browserify({
      transform: [reactify]
    }))
    .pipe(gulp.dest('./assets'))
});
