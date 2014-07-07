!(function (window, undefined) {
  'use strict';

  var nameRe = '([\-_\.A-z0-9]+)'
  , githubIssueUrlRe = new RegExp('https?://github.com/' + nameRe + '/'
								                  + nameRe + '/(?:pull|issues)/([0-9]+)')
  , lgtmUrlTmp = 'http://lgtmin-gh-bmlt.herokuapp.com/lgtm?user=$USER&repo=$REPO&number=$NUMBER'
  , match, user, repo, number
  ;

  match = location.href.match(githubIssueUrlRe);

  if(!match || !match[1] || !match[2] || !match[3]) {
    window.alert('Error!: Execute this bookmarklet on github issue page.');
    return;
  }

  user = match[1], repo = match[2], number = match[3];

  window.open(lgtmUrlTmp.replace('$USER', user)
              .replace('$REPO', repo)
              .replace('$NUMBER', number));
})(window);
