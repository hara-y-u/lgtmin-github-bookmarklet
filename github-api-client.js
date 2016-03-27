'use strict';

var GitHubApi = require("github")
, util = require('util')
, jwt = require('jsonwebtoken')
, OAuth2 = require("oauth").OAuth2
, AUTH = {
  clientId: process.env.GITHUB_API_CLIENT_ID || ''
  , clientSecret: process.env.GITHUB_API_CLIENT_SECRET || ''
}
;

module.exports = GitHubApiClient;

/**
 * abstracts retriving access token of github api
 * @param {Object} app koa app object configured to use session and csrf
 * @param {Object} router koa-router object
 * @param {Object} options
 *   - [`callbackPath`] OAuth callback path
 */
function GitHubApiClient(app, router, options) {
  var self = this
  , requestAccessToken
  , verifyState
  ;

  options = options || {};
  options.scope = options.scope || 'repo';
  this.options = options;

  this._app = app;

  this.gitHubApiOptions = {
    version: '3.0.0',
    debug: 'development' == process.env.NODE_ENV,
    protocol: 'https',
    timeout: 5000
  };

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

  verifyState = function(state) {
    return function(callback) {
      jwt.verify(state, app.keys[0], callback);
    }
  };

  // Configure App
  router.get(this.callbackPath, function *(next) {
    var code = this.request.query.code
    , state = this.request.query.state
    , decodedState
    , ctx = this
    , accessToken
    ;

    decodedState = yield verifyState(state);
    if(decodedState.rfp != this.session.github_api_client_csrf) {
      this.throw('OAuth state parameters dont match.');
    }

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
      console.log('An error has occurred during retriving access token: '
                  + util.inspect(e));
      this.throw(e);
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
  , redirectToAuthorizeUrl: function(ctx) {
    var csrf = ctx.session.github_api_client_csrf = ctx.csrf
    , state = jwt.sign({rfp: csrf}, this._app.keys[0])
    ;

    ctx.session.github_api_client_redirect_path
      = ctx.request.originalUrl;

    ctx.response.redirect(this.oauth.getAuthorizeUrl({
      redirect_uri: this.urlToHost(ctx) + this.callbackPath
      , scope: this.options.scope
      , state: state
    }));
  }
  , requireAuth: function(body, fallbackPathGen) {
    var self = this
    ;

    return function *(next) {
      var ctx = this.context || this
      , token, github
      ;

      github = new GitHubApi(self.gitHubApiOptions);

      function *fallback() {
        if(fallbackPathGen == null) {
          self.redirectToAuthorizeUrl(ctx);
        } else {
          ctx.redirect(yield fallbackPathGen.call(ctx));
        }
      }

      token = self.loadToken(ctx);
      if (!token) { return yield fallback(); }
      github.authenticate({
        type: 'oauth'
        , token: token
      });
      ctx.github = github;

      try {
        yield body.call(this, next);
      } catch (e) {
        console.log('An error has occurred on using GitHub API: '
                    + util.inspect(e));
        if (e.code == 401) {
          console.log('Reset Token..')
          self.saveToken(ctx, null);
          return yield fallback();
        } else {
          this.throw(e);
        }
      }
    };
  }
};
