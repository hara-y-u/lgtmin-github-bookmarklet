'use strict';

(function (window, undefined){
  function isMobile() {
    if(navigator.userAgent.match(/Android/i)
       || navigator.userAgent.match(/webOS/i)
       || navigator.userAgent.match(/iPhone/i)
       || navigator.userAgent.match(/iPad/i)
       || navigator.userAgent.match(/iPod/i)
       || navigator.userAgent.match(/BlackBerry/i)
       || navigator.userAgent.match(/Windows Phone/i)
      ) {
      return true;
    } else {
      return false;
    }
  }

  function onWindowClosed(window, fn) {
    var timer
    ;
    timer = setInterval(function() {
      if(window.closed) {
        clearInterval(timer);
        fn(window);
      }
    }, 500);
  }

  var nameRe = '([\-_\.A-z0-9]+)'
  , githubIssueUrlRe = new RegExp('^https?://github.com/' + nameRe + '/'
                                  + nameRe + '/(?:pull|issues)/([0-9]+)')
  , homeUrl = 'http://lgtmin-gh-bmlt.herokuapp.com'
  , lgtmUrlTemplate = homeUrl + '/lgtm?user=$USER&repo=$REPO&number=$NUMBER'
  , match, user, repo, number
  , lgtmWin, timer
  , isMobile = isMobile()
  ;

  match = window.location.href.match(githubIssueUrlRe);

  if(!match || !match[1] || !match[2] || !match[3]) {
    if(window.location.href.indexOf(homeUrl) == 0) {
      window.alert('Bookmark Me!');
    } else {
      window.alert('Error!: Execute this bookmarklet on github issue page.');
    }
    return;
  }

  user = match[1], repo = match[2], number = match[3];

  lgtmWin = window.open(lgtmUrlTemplate
                        .replace('$USER', user)
                        .replace('$REPO', repo)
                        .replace('$NUMBER', number)
                       );
  lgtmWin.focus();

  if(isMobile) {
    onWindowClosed(lgtmWin, function(_win) {
      window.location.reload();
    });
  }
})(window);
