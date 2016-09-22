const
  url = require('url'),
  qs = require('qs'),
  WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({
    port: Number(process.env.WS_PORT || 11099)
  })

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
      ws.close(Number(query.exitCode), query.exitMessage)
    }, query.delay || 20)
  }
})