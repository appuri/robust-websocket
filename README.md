## robust-websocket

#### A robust, reconnecting WebSocket client for the browser

[![SauceLabs Test Status](https://saucelabs.com/browser-matrix/robustwebsocket.svg)](https://saucelabs.com/u/robustwebsocket)

`robust-websocket` is a wrapper around the standard [WebSocket]() class that implements the same interface, but can reconnect when disconnected or the user's computer comes back online.

It is error-code aware and will not reconnect on 1008 (HTTP 400 equivalent) and 1011 (HTTP 500 equivalent) by default. This behavior is fully configurable via the `shouldConnect` (see below).

### Compared to [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket)

- Tests! You know it works like stated and regressions will be caught.
- Is aware of online and offline, and won't burn up the users battery and CPU reconnected when offline, and will reconnect when it is online again.
- Natively aware of error codes

### Usage

To come!


[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[CloseEvent]: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent