var util = require('util')
, koa = require('koa')
, common = require('koa-common')
, router = require('koa-router')
, Q = require('q')
, port = process.env.PORT || 3000
, app = koa()
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
app.use(router(app));

client = new Client(app);

app.get('/', function *(next) {
});

app.get('/lgtm', function *(next) {
  yield client.authenticate(this, function *(err, github){
    var ret
    , req = this.request
    , user = req.query.user
    , repo = req.query.repo
    , number = req.query.number
    , hash = req.query.hash
    ;

    ret = yield Q.denodeify(github.issues.createComment)({
      user: user
      , repo: repo
      , number: number
      , body: lgtmMarkdown(hash)
    }).then(function(comments) {
      return comments;
    });

    this.body = util.inspect(ret);
  });
});

app.listen(port);
