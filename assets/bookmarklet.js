!(function (window, undefined) {
  'use strict';

  var nameRe = '([\-_\.A-z0-9]+)'
  , githubIssueUrlRe = new RegExp('https?://github.com/' + nameRe + '/'
                                  + nameRe + '/(?:pull|issues)/([0-9]+)')
  , homeUrl = 'http://lgtmin-gh-bmlt.herokuapp.com'
  , lgtmUrlTemplate = homeUrl + '/lgtm?user=$USER&repo=$REPO&number=$NUMBER'
  , match, user, repo, number
  ;

  match = location.href.match(githubIssueUrlRe);

  if(!match || !match[1] || !match[2] || !match[3]) {
    if(location.href.indexOf(homeUrl) == 0) {
      window.alert('Bookmark Me!');
    } else {
      window.alert('Error!: Execute this bookmarklet on github issue page.');
    }
    return;
  }

  user = match[1], repo = match[2], number = match[3];

  window.open(lgtmUrlTemplate
              .replace('$USER', user)
              .replace('$REPO', repo)
              .replace('$NUMBER', number)
             ).focus();
})(window);
