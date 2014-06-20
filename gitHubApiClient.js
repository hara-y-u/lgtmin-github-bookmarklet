var GitHubApi = require("github")
, util = require('util')
, common = require('koa-common')
, Q = require('q')
, OAuth2 = require("oauth").OAuth2
, AUTH = {
  clientId: process.env.GITHUB_API_CLIENT_ID || ''
  , clientSecret: process.env.GITHUB_API_CLIENT_SECRET || ''
}
;

module.exports = GitHubApiClient;

function GitHubApiClient(app, options) {
  var self = this
  , requestAccessToken
  ;

  options = options || {};

  this.github = new GitHubApi({
    // required
    version: '3.0.0',
    // optional
    debug: true,
    protocol: 'https',
    timeout: 5000
  });

  this.oauth = new OAuth2(AUTH.clientId
                          , AUTH.clientSecret
                          , "https://github.com/"
                          , "login/oauth/authorize"
                          , "login/oauth/access_token"
                         );

  this.callbackPath = options.callbackPath || '/oauth/callback'

  requestAccessToken = function(code) {
    return function(callback) {
      self.oauth.getOAuthAccessToken(code, {}, callback);
    };
  };

  // Configure App
  app.get(this.callbackPath, function *(next) {
    var code = this.request.query.code
    , ctx = this
    , accessToken
    ;

    try {
      accessToken = (yield requestAccessToken(code))[0];
      self.saveToken(ctx, accessToken);
      if (ctx.session.github_api_client_redirect_path) {
        ctx.response.redirect(ctx.session.github_api_client_redirect_path);
        ctx.session.github_api_client_redirect_path = null;
      } else {
        ctx.response.redirect('/');
      }
    } catch (e) {
      ctx.body = util.inspect(e);
    }
  });
}

GitHubApiClient.prototype = {
  loadToken: function(ctx) {
    return ctx.session.github_api_access_token;
  }
  , saveToken: function(ctx, token) {
    return ctx.session.github_api_access_token = token;
  }
  , urlToHost: function(ctx) {
    return ctx.request.protocol + '://' + ctx.request.get('host');
  }
  , authenticate: function *(ctx, callback) {
    var token = this.loadToken(ctx)
    ;

    ctx.session.github_api_client_redirect_path
      = ctx.request.originalUrl;

    if (!token) {
      ctx.response.redirect(this.oauth.getAuthorizeUrl({
        redirect_uri: this.urlToHost(ctx) + this.callbackPath
        , scope: 'repo,repo:status,user'
      }));
    } else {
      this.github.authenticate({
        type: 'oauth'
        , token: token
      });
      try {
        yield callback.call(ctx, null, this.github);
      } catch (e) {
        // FIXME
        if (e.message.toString().indexOf('Bad credentials') > -1) {
          this.saveToken(ctx, null);
          this.authenticate(ctx, callback);
        } else {
          console.log(util.inspect(e));
        }
      }
    }
  }
};
