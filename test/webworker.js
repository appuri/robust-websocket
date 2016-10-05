importScripts(
  '../node_modules/object.assign/dist/browser.js',
  './CustomEvent.js',
  '../robust-websocket.js'
)

var ws = new RobustWebSocket('ws://localhost:9999/echo')
ws.onopen = function() {
  ws.send('hello')
}
ws.addEventListener('message', function(event) {
  if (event.data === 'hello') {
    ws.close()
    postMessage('howdy')
  }
})