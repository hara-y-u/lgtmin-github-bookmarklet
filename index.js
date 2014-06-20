var util = require('util')
, koa = require('koa')
, common = require('koa-common')
, router = require('koa-router')
, Q = require('q')
, GitHubApi = require("github")
, app = koa()
, github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: true,
  protocol: 'https',
  timeout: 5000
})
, port = process.env.PORT || 3000
;

app.use(common.logger());
app.keys = ['FIXME'];
app.use(common.session());
app.use(router(app));

app.get('/', function *(next) {
  // github api example
  var res = yield Q.denodeify(github.user.getFollowingFromUser)({
    user: 'mikedeboer'
  }).then(function(res) {
    return res;
  });

  // session example
  var n = this.session.views || 0;
  this.session.views = ++n;

  this.body = n + 'views\n\n' + util.inspect(res);
});

app.get('/login', function *(next) {
  
});

app.listen(port);
