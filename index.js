'use strict';

var util = require('util')
, fs = require('fs')
, koa = require('koa')
, common = require('koa-common')
, router = require('koa-router')
, stylus = require('stylus')
, send = require('koa-send')
, views = require('co-views')
, parse = require('co-body')
, Q = require('q')
, request = Q.denodeify(require('request'))
, port = process.env.PORT || 3000
, app = koa()
, csrf = require('koa-csrf')
, key = process.env.APP_KEY || 'im a secret'
, Client = require('./github-api-client.js')
, client
, UglifyJs = require('uglify-js')
, nib = require('nib')
, jeet = require('jeet')
, lgtmMarkdown = function(hash) {
  return '![LGTM](http://www.lgtm.in/p/' + hash + ')';
}
;

// base setup
app.use(common.logger());
app.keys = [key];
app.use(common.session());
csrf(app);

// views
app.use(function *(next) {
  var _render = views('views', { default: 'jade' });
  this.render = function (view, locals) {
    var body, html
    ;

    if (!locals) locals = {};

    return function *() {
      this.type = 'text/html';
      body = yield _render(view, locals);
      html = yield _render('layout', { body: body });
      this.body = html;
    }
  }

  yield next;
});

// assets
app.use(function *(next) {
  function compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(nib())
      .use(jeet());
  }
  yield Q.denodeify(stylus.middleware({
    src: __dirname + '/assets',
    compile: compile
  }))(
    this.req, this.res
  );
  yield next;
});

// serve assets as static
app.use(function *(next){
  yield send(this, this.path, { root: __dirname + '/assets' });
  yield next;
});

// routes
app.use(router(app));

client = new Client(app);

app.get('/', function *(next) {
  var bmltCode = yield Q.denodeify(fs.readFile)(
    __dirname + '/bookmarklet.js', 'utf8'
  ).then(function(data) {
    return 'javascript:' + encodeURIComponent(
      UglifyJs.minify(data, {fromString: true}).code
    );
  })
  ;
  
  yield this.render('index', {
   bmltCode: bmltCode
  });
});

function assertParams(ctx, params, valids) {
  var key, val
  ;
  try {
    if(valids.sort().toString()
       !== Object.keys(params).sort().toString()) {
      ctx.throw(400, 'Bad Request');
    }
  } catch (e) {
    ctx.throw(400, 'Bad Request');
  }
  for(key in params) {
    val = params[key];
    if(val == null || val == '') {
      ctx.throw(400, 'Bad Request');
    }
  }
}

app.get('/lgtm', function *(next) {
  var NUM_LGTMS = 3
  , ret
  , lgtmReqs = []
  , lgtms = []
  , i
  ;

  assertParams(this, this.request.query, ['user', 'repo', 'number']);

  for(i = 0; i < NUM_LGTMS; i++) {
    lgtmReqs.push(request({
      json: true
      , url: 'http://www.lgtm.in/g'
    }));
  }

  ret = yield lgtmReqs;

  ret.forEach(function(_ret) { lgtms.push(_ret[1]); });

  yield this.render('lgtm', {
    lgtms: lgtms
    , query: this.request.query
    , csrf: this.csrf
  });
});

app.post('/lgtm/create', client.requireAuth(function *(next) {
  var ret
  , lgtm = yield parse(this)
  ;

  this.assertCsrf(lgtm);
  delete lgtm._csrf;
  assertParams(this, lgtm, ['user', 'repo', 'number', 'hash']);

  ret = yield Q.denodeify(this.github.issues.createComment)({
    user: lgtm.user
    , repo: lgtm.repo
    , number: lgtm.number
    , body: lgtmMarkdown(lgtm.hash)
  }).then(function(ret) {
    return ret;
  });

  this.body = util.inspect(ret);
}));

app.listen(port);
