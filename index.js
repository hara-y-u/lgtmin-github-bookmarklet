var util = require('util')
, koa = require('koa')
, common = require('koa-common')
, router = require('koa-router')
, Q = require('q')
, port = process.env.PORT || 3000
, app = koa()
, key = process.env.APP_KEY || 'im a secret'
, Client = require('./gitHubApiClient.js')
, client
;

app.use(common.logger());
app.keys = [key];
app.use(common.session());
app.use(router(app));

client = new Client(app);

app.get('/', function *(next) {
  yield client.authenticate(this, function *(err, github){
    var res
    ;

    res = yield Q.denodeify(github.pullRequests.getAll)({
      user: this.request.query.user
      , repo: this.request.query.repo
      , state: 'all'
    }).then(function(res) {
      return res;
    });

    this.body = util.inspect(res);
  });
});

app.listen(port);
