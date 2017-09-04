# robust-websocket

#### A robust, reconnecting WebSocket client for the browser

[![SauceLabs Test Status](https://saucelabs.com/browser-matrix/robustwebsocket.svg)](https://saucelabs.com/u/robustwebsocket)

`robust-websocket` is a wrapper around the standard [WebSocket] class that implements the same interface, but can reconnect when disconnected or the user's computer comes back online.

It is error-code aware and will not reconnect on 1008 (HTTP 400 equivalent) and 1011 (HTTP 500 equivalent) by default. This behavior is fully configurable via the `shouldConnect` (see [Usage](https://github.com/appuri/robust-websocket#usage)).

### Compared to [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket)

- Tests! You know it works like stated and regressions will be caught.
- Is aware of online and offline, and won't burn up the users battery and CPU reconnected when offline, and will reconnect when it is online again.
- Natively aware of error codes
- Any kind of reconnect strategy is possible via functional composition

## Usage

[CodePen Example](https://codepen.io/nathanboktae/pen/RoLXmw)

Use it as you would a normal websocket:

```javascript
var ws = new RobustWebSocket('ws://echo.websocket.org/')

ws.addEventListener('open', function(event) {
  ws.send('Hello!')
})

ws.addEventListener('message', function(event) {
  console.log('we got: ' + event.data)
})
```

But with an optional set of options you can specify as a 3rd parameter

```javascript
var ws = new RobustWebSocket('ws://echo.websocket.org/', null {
   // The number of milliseconds to wait before a connection is considered to have timed out. Defaults to 4 seconds.
   timeout: 4000,
  // A function that given a CloseEvent or an online event (https://developer.mozilla.org/en-US/docs/Online_and_offline_events) and the `RobustWebSocket`,
  // will return the number of milliseconds to wait to reconnect, or a non-Number to not reconnect.
  // see below for more examples; below is the default functionality.
  shouldReconnect: function(event, ws) {
    if (event.code === 1008 || event.code === 1011) return
    return [0, 3000, 10000][ws.attempts]
  },
  // A boolean indicating whether or not to open the connection automatically. Defaults to true, matching native [WebSocket] behavior.
  // You can open the websocket by calling `open()` when you are ready. You can close and re-open the RobustWebSocket instance as much as you wish.
  automaticOpen: true,
  // A boolean indicating whether to disable subscribing to the connectivity events provided by the browser.
  // By default RobustWebSocket instances use connectivity events to avoid triggering reconnection when the browser is offline. This flag is provided in the unlikely event of cases where this may not be desired.
  ignoreConnectivityEvents: false
})
```

#### `shouldReconnect` Examples

Reconnect with an exponetial backoff on all errors
```javascript
function shouldReconnect(event, ws) {
  return Math.pow(1.5, ws.attempts) * 500
}
```

Reconnect immediately but only 20 times per RobustWebSocket instance
```javascript
function shouldReconnect(event, ws) {
  return ws.reconnects <= 20 && 0
}
```

Reconnect only on some whitelisted codes, and only 3 attempts, except on online events, then connect immediately
```javascript
function shouldReconnect(event, ws) {
  if (event.type === 'online') return 0
  return [1006,1011,1012].indexOf(event.code) && [1000,5000,10000][ws.attempt]
}
```

See documentation for [CloseEvent] and [online event](https://developer.mozilla.org/en-US/docs/Online_and_offline_events), the two types of events that `shouldReconnect` will receive.

Typically, websockets closed with code `1000` indicate that the socket
closed normally. In these cases, `robust-websocket` won't call
`shouldReconnect` (and will not attempt to reconnect), unless you set
`shouldReconnect.handle1000` to `true`.

### Polyfills needed

You may need these polyfills to support older browsers

- [Object.assign](http://kangax.github.io/compat-table/es6/#test-Object_static_methods_Object.assign) - [npm package](https://www.npmjs.com/package/object.assign) or 24-line [MDN snippet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [CustomEvent](http://caniuse.com/#search=CustomEvent) - [npm package](https://www.npmjs.com/package/customevent-polyfill) or 15-line [MDN snippet](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)

[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[CloseEvent]: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
