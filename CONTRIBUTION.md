Welcome to join us. Please read the following instructions to setup your local development environment.

First, install [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (npm is included).

then, install the necessary dependencies:

```shell
npm ci
```

you can run it once you have finished it:

```shell
npm start
```

The Vite dev server proxies API and WebSocket requests to the clash controller
at `http://127.0.0.1:9090` by default. Set `CLASH_API` to use another address.
