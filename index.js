'use strict';

var util = require('util')
, koa = require('koa')
, common = require('koa-common')
, router = require('koa-router')
, views = require('co-views')
, parse = require('co-body')
, Q = require('q')
, request = Q.denodeify(require('request'))
, port = process.env.PORT || 3000
, app = koa()
, csrf = require('koa-csrf')
, key = process.env.APP_KEY || 'im a secret'
, Client = require('github-api-client')
, client
, lgtmMarkdown = function(hash) {
  return '![LGTM](http://www.lgtm.in/p/' + hash + ')';
}
;

app.use(common.logger());
app.keys = [key];
app.use(common.session());
csrf(app);
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
app.use(router(app));

client = new Client(app);

app.get('/', function *(next) {
  this.body = 'hello';
});

app.get('/lgtm', function *(next) {
  var NUM_LGTMS = 3
  , ret
  , lgtmReqs = []
  , lgtms = []
  , i
  ;

  for(i = 0; i < NUM_LGTMS; i++) {
    lgtmReqs.push(request({
      json: true
      , url: 'http://www.lgtm.in/g'
    }));
  }

  ret = yield lgtmReqs;

  ret.forEach(function(_ret) { lgtms.push(_ret[1]); });

  this.session._csrf
  yield this.render('index', {
    lgtms: lgtms
    , query: this.request.query
    , csrfToken: this.csrf
  });
});

app.post('/lgtm/create', client.requireAuth(function *(next) {
  var ret
  , lgtm = yield parse(this)
  ;

  this.assertCsrf(lgtm);

  ret = yield Q.denodeify(this.github.issues.createComment)({
    user: lgtm.user
    , repo: lgtm.repo
    , number: lgtm.number
    , body: lgtmMarkdown(lgtm.hash)
  }).then(function(comments) {
    return comments;
  });

  this.body = util.inspect(ret);
}));

app.listen(port);
