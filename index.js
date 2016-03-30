'use strict';

const util = require('util')
, fs = require('fs')
, path = require('path')
, koa = require('koa')
, app = koa()
, common = require('koa-common')
, router = require('koa-router')()
, stylus = require('stylus')
, staticCache = require('koa-static-cache')
, views = require('co-views')
, parse = require('co-body')
, Q = require('q')
, request = Q.denodeify(require('request'))
, port = process.env.PORT || 3000
, csrf = require('koa-csrf')
, key = process.env.APP_KEY || 'im a secret'
, Client = require('./github-api-client.js')
, UglifyJs = require('uglify-js')
, nib = require('nib')
, jeet = require('jeet')
, browserify = require('./browserify-middleware')
, lgtmMarkdown = hash => `[![LGTM](http://www.lgtm.in/p/${hash})](http://www.lgtm.in/i/${hash})`
, TITLE = 'LGTM.in GitHub Bookmarklet'
;

let client;


// base setup
app.use(common.logger());
app.keys = [key];
app.use(common.session());
csrf(app);

// views
app.use(function *(next) {
  const _render = views('views', { default: 'jade' });
  this.render = (view, locals) => {
    let body, html;

    if (!locals) locals = {};

    locals.title = TITLE;

    return function *() {
      this.type = 'text/html';
      body = yield _render(view, locals);
      html = yield _render('layout', { title: TITLE, body });
      this.body = html;
    }
  }

  yield next;
});

// assets
if (process.env.NODE_ENV != 'production') {
  // browserify dynamically only on development
  app.use(browserify({
    dir: `${__dirname}/assets/src/browserify`
    , transform: ['babelify', { presets: ['es2015', 'react'] }]
  }));
  // stylus
  app.use(function *(next) {
    function compile(str, path) {
      return stylus(str)
        .set('filename', path)
        .set('compress', true)
        .use(nib())
        .use(jeet());
    }

    yield Q.denodeify(stylus.middleware({
      src: path.join(__dirname, '/assets/src'),
      dest: path.join(__dirname, '/assets'),
      compile
    }))(this.req, this.res);

    yield next;
  });
}
// static
app.use(staticCache(path.join(__dirname, 'assets'), {
  maxAge: 30 * 24 * 60 * 60
  , buffer: true
  , gzip: true
}));

client = new Client(app, router, {
  scope: 'user repo'
});

router.get('/', function *(next) {
  const req = this.request,
        bmltCode = yield Q.denodeify(fs.readFile)(
          `${__dirname}/assets/src/bookmarklet.js`, 'utf8'
        ).then(data => {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          data = data.replace('{BASE_URL}', baseUrl);
          return `javascript:(function(window,undefined) {${encodeURIComponent(UglifyJs.minify(data, {fromString: true}).code)}})(window);`
          ;
        });

  yield this.render('index', {
   bmltCode
  });
});

function assertParams(ctx, params, requiredKeys) {
  let key, val;
  for(key of requiredKeys) {
    val = params[key];
    if(val == null || val == '') {
      ctx.throw(400, 'Bad Request, required key is missing.');
    }
  }
}

router.get('/out', function* (next) {
  this.session.github_login_user = null;
  client.saveToken(this, null);
  this.redirect('back');
});

// Wrapper for lgtm.in/g
router.get('/random', function *(next) {
  const user = this.request.query.user;
  let json;

  json = yield request({
    url: `http://www.lgtm.in/g/${user ? user : ''}`,
    headers: {
      'Accept': 'application/json'
    }
  }).then((res) => { return res[res.length -1]; });

  this.set('Cache-Control', 'no-store, no-cache');
  this.body = JSON.parse(json);
});

router.get('/lgtm', client.requireAuth(function *(next) {
  // cache github login user
  if (!this.session.github_login_user) {
    this.session.github_login_user
      = yield Q.denodeify(this.github.user.get)({})
      .then(ret => ret);
  }

  yield this.render('lgtm', {
    csrf: this.csrf
    , user: this.session.github_login_user
  });
}));

router.post('/lgtm', client.requireAuth(function *(next) {
  let ret;
  const lgtm = yield parse(this);

  this._lgtm = lgtm;

  this.assertCsrf(lgtm);
  delete lgtm._csrf;
  assertParams(this, lgtm, ['user', 'repo', 'number', 'hash']);

  if (lgtm.text != '') { lgtm.text += '\n\n'; }

  ret = yield Q.denodeify(this.github.issues.createComment)({
    user: lgtm.user
    , repo: lgtm.repo
    , number: lgtm.number
    , body: lgtm.text + lgtmMarkdown(lgtm.hash)
  }).then(ret => ret);

  yield this.render('lgtm_create');
}, function *() {
  const lgtm = this._lgtm;

  return `/lgtm?user=${lgtm.user}&repo=${lgtm.repo}&number=${lgtm.number}`
  ;
}));


// routes
app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(port);
