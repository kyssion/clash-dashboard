<h1 align="center">
    <img src="https://github.com/Dreamacro/clash/raw/master/docs/logo.png" alt="Clash" width="200">
    <br>
    Clash Dashboard
    <br>
</h1>

<h4 align="center">Web Dashboard for Clash</h4>

> This dashboard is integrated into the clash repository (`dashboard/`). Its
> production build is embedded into the clash binary and served from `/ui/`,
> so the dashboard starts together with clash. API and WebSocket requests use
> the page's own origin — there is no external-controller connection dialog.
>
> If the controller has a `secret`, open
> `http://127.0.0.1:9090/ui/#/overview?secret=YOUR_SECRET`.
>
> For reverse-proxy deployments, configure the public origin in Clash with
> `external-controller-cors.allow-origins`; `Host`/`X-Forwarded-Host` are not
> trusted automatically. If the API is not at the parent path of `/ui/`, add
> `<meta name="clash-api-base" content="/clash">` to the external UI's
> `index.html`. WebSocket secrets are sent as a subprotocol, not in the URL.

## Features

  - All ClashX configurations
  - Manage Proxies
  - Manage Proxy Groups
  - Realtime Log

## Progress

See [Projects](https://github.com/Dreamacro/clash-dashboard/projects)

### Development Env

Start clash first, then run the Vite dev server:

```bash
$ npm start
```

The dev server listens on `http://localhost:3000/` and proxies API/WebSocket
requests to `http://127.0.0.1:9090` by default. Set `CLASH_API` to point at a
different controller, for example:

```bash
$ CLASH_API=http://127.0.0.1:9999 npm start
```

### Build for production

```bash
$ npm run build
```

The generated `dist/` is embedded by the parent clash project. Rebuild it with
`make dashboard` from the repository root when the frontend changes.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars2.githubusercontent.com/u/3380894?v=4" width="100px;"/><br /><sub><b>Jason Chen</b></sub>](https://ijason.cc)<br />[🎨](#design-jas0ncn "Design") [💻](https://github.com/Dreamacro/clash-dashboard/commits?author=jas0ncn "Code") [🐛](https://github.com/Dreamacro/clash-dashboard/issues?q=author%3Ajas0ncn "Bug reports") [🤔](#ideas-jas0ncn "Ideas, Planning, & Feedback") [👀](#review-jas0ncn "Reviewed Pull Requests") [🌍](#translation-jas0ncn "Translation") | [<img src="https://avatars1.githubusercontent.com/u/8615343?v=4" width="100px;"/><br /><sub><b>Dreamacro</b></sub>](https://github.com/Dreamacro)<br />[💻](https://github.com/Dreamacro/clash-dashboard/commits?author=Dreamacro "Code") [🐛](https://github.com/Dreamacro/clash-dashboard/issues?q=author%3ADreamacro "Bug reports") [🤔](#ideas-Dreamacro "Ideas, Planning, & Feedback") [👀](#review-Dreamacro "Reviewed Pull Requests") [🌍](#translation-Dreamacro "Translation") [📦](#platform-Dreamacro "Packaging/porting to new platform") | [<img src="https://avatars1.githubusercontent.com/u/12679581?v=4" width="100px;"/><br /><sub><b>chs97</b></sub>](http://www.hs97.cn)<br />[💻](https://github.com/Dreamacro/clash-dashboard/commits?author=chs97 "Code") [🐛](https://github.com/Dreamacro/clash-dashboard/issues?q=author%3Achs97 "Bug reports") [👀](#review-chs97 "Reviewed Pull Requests") | [<img src="https://avatars3.githubusercontent.com/u/11733500?v=4" width="100px;"/><br /><sub><b>Yicheng</b></sub>](https://github.com/yichengchen)<br />[🤔](#ideas-yichengchen "Ideas, Planning, & Feedback") [📦](#platform-yichengchen "Packaging/porting to new platform") |
| :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

## LICENSE

MIT License
