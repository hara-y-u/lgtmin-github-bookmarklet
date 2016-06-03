var browserify = require('browserify')
, path = require('path')
, extnames = {
  '.js': '.jsx'
}
;

module.exports = function (options) {
  var dir = path.resolve(options.dir || '.')
  ;

  return function* (next) {
    var ext = path.extname(this.path)
    , fileName = path.basename(this.path, ext)
    , localExt = extnames[ext]
    , srcFile = path.format({dir: dir, name: fileName, ext: localExt})
    , b = browserify()
    , minify, code
    ;

    if (!localExt) {
      return yield next;
    }

    b.add(srcFile);

    if (options.transform) {
      b.transform.apply(b, options.transform);
    }

    return this.body = b.bundle();
  };
};
