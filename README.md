LGTM.in GitHub Bookmarklet
==========================

Bookmarklet to post LGTM on GitHub issues. Many browsers are supported!

![Screen Shot](./assets/screen.png)

### Confirmed Browsers

* ✔ Sarari (Mac, iOS)
* ✔ Chrome (Mac)
* ✔ Opera (Mac)
* × Firefox (due to CSP issue: https://bugzilla.mozilla.org/show_bug.cgi?id=866522)

### Deploy

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/yukihr/lgtmin-github-bookmarklet)

#### configs

After you made new app, you have to set env vars to configure app. First, to retrive GitHub Api client ID/Secret, register new app on [GitHub Settings](https://github.com/settings/applications/new). Callback URL must be like `{Your App URL}/oauth/callback`. You can see ID/Secret on app's individual page.

And then, register below configs on [Heroku Dashboard](https://dashboard-next.heroku.com/apps).

```
NODE_ENV=production
APP_KEYS={Your arbitrary secret key}
GITHUB_API_CLIENT_ID={GitHub Api client ID for your app}
GITHUB_API_CLIENT_SECRET={GitHub Api client Secret for your app}
```
