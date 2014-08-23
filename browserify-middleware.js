var JS_RE = /\.js$/
, browserify = require('browserify')
, resolve = require('path').resolve
;

module.exports = function (options) {
  var root = resolve(options.root || '.')
  , bundleOpts = {
    debug: !!options.debug
  }
  ;
  
  return function* (next) {
    var path = this.path
    , minify, code
    , fileName = root + path
    , b = browserify()
    ;

    if (!JS_RE.test(path)) {
      return yield next;
    }

    b.add(fileName);

    if (options.transform) {
      b.transform(options.transform);
    }

    return this.body = b.bundle(bundleOpts);
  };

};
