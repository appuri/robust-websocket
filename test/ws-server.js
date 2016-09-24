const
  url = require('url'),
  qs = require('qs'),
  ws = require('ws'),
  ErrorCodes = require(require.resolve('ws').replace('index.js', 'lib/ErrorCodes')),
  wss = new ws.Server({
    port: Number(process.env.WS_PORT || 11099)
  })

// stub this out so we can do more through testing on the client side
ErrorCodes.isValidErrorCode = () => true

wss.on('connection', function (ws) {
  var path = url.parse(ws.upgradeReq.url),
      query = qs.parse(path.query)

  ws.on('message', function (message) {
    if (path.pathname.startsWith('/echo')) {
      ws.send(message)
    }
  })

  if (query.greet) {
    ws.send(query.greet)
  }

  if (query.exitCode) {
    setTimeout(function() {
      console.log('closing connection with code %d, message %s', query.exitCode, query.exitMessage)
      ws.close(Number(query.exitCode), query.exitMessage)
    }, Number(query.delay || 500))
  }
})