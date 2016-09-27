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

Use it as you would a normal websocket:

```javascript
var ws = new RobustWebSocket('ws://echo.websocket.org/')
ws.addEventListener('message', function(event) {
  console.log('we got: ' + event.data)
})

ws.send('Hello!')
```

But with an optional set of options you can specify as a 3rd parameter

#### `timeout`

The number of milliseconds to wait before a connection is considered to have timed out. Defaults to 4 seconds.

#### `shouldReconnect`

A funtion that given a [CloseEvent]() or [online event](https://developer.mozilla.org/en-US/docs/Online_and_offline_events)


### Polyfills needed

You may need these polyfills to support older browsers

- [Object.assign](http://kangax.github.io/compat-table/es6/#test-Object_static_methods_Object.assign) - [npm package](https://www.npmjs.com/package/object-assign) or 24-line [MDN snippet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [CustomEvent](http://caniuse.com/#search=CustomEvent) - [npm package](https://www.npmjs.com/package/custom-event) or 15-line [MDN snippet](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)

[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[CloseEvent]: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent