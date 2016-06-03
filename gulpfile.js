var gulp = require('gulp')
, fs = require('fs')
, browserify = require('browserify')
, stylus = require('gulp-stylus')
, nib = require('nib')
, jeet = require('jeet')
;

gulp.task('browserify', function() {
  browserify(__dirname + '/assets/src/browserify/lgtm.jsx')
    .transform('babelify', {presets: ['es2015', 'react']})
    .transform('uglifyify')
    .bundle()
    .pipe(fs.createWriteStream(__dirname + '/assets/lgtm.js'))
});

gulp.task('stylus', function() {
  gulp.src(__dirname + '/assets/src/app.styl')
    .pipe(stylus({use: [nib(), jeet()]}))
    .pipe(gulp.dest(__dirname + '/assets'));
});

gulp.task('default', ['browserify', 'stylus']);
