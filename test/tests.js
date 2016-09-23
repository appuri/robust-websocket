describe('RobustWebSocket', function() {
  var ws, serverUrl = 'ws://localhost:11099'
  afterEach(function() {
    try {
      if (ws) {
        ws.listeners.length = 0
        ws.onclose = null
        ws.close()
      }
    } catch (e) {}
  })

  function wrap(fn, done) {
    return function() {
      try {
        fn.apply(this, arguments)
      } catch(e) {
        done(e)
      }
    }
  }

  describe('web standards behavior', function() {
    it('should forward messages and errors to the client via event listeners', function(done) {
      ws = new RobustWebSocket(serverUrl + '/echo')

      ws.addEventListener('open', wrap(function(evt) {
        this.should.equal(ws)
        evt.target.should.be.instanceof(WebSocket)
        evt.reconnects.should.equal(0)
        evt.attempts.should.equal(1)
        ws.send('hello!')
      }, done))

      var onmessage = sinon.spy(function(evt) {
        evt.data.should.equal('hello!')
        evt.target.should.be.instanceof(WebSocket)
        ws.close()
      })
      ws.addEventListener('message', wrap(onmessage, done))

      ws.addEventListener('close', wrap(function() {
        onmessage.should.have.been.calledOnce
        done()
      }, done))
    })

    it('should forward messages and errors to the client via on* properties', function(done) {
      ws = new RobustWebSocket(serverUrl + '/echo')

      ws.onopen = wrap(function(evt) {
        this.should.equal(ws)
        evt.target.should.be.instanceof(WebSocket)
        evt.reconnects.should.equal(0)
        evt.attempts.should.equal(1)
        ws.send('hello!')
      }, done)

      ws.onmessage = sinon.spy(wrap(function(evt) {
        evt.data.should.equal('hello!')
        evt.target.should.be.instanceof(WebSocket)
        ws.close()
      }, done))

      ws.addEventListener('close', wrap(function(evt) {
        ws.onmessage.should.have.been.calledOnce
        evt.code.should.equal(1000)
        done()
      }, done))
    })

    it('should proxy read only properties', function() {
      ws = new RobustWebSocket(serverUrl)
      ws.url.should.equal(serverUrl + '/')
      ws.protocol.should.equal('')
      ws.readyState.should.equal(WebSocket.CONNECTING)
      ws.bufferedAmount.should.equal(0)

      return pollUntilPassing(function() {
        ws.readyState.should.equal(WebSocket.OPEN)
      })
    })

    it('should rethrow errors', function() {
      (function() {
        new RobustWebSocket('localhost:11099')
      }).should.throw('The URL\'s scheme must be either \'ws\' or \'wss\'.')

      ;(function() {
        ws = new RobustWebSocket(serverUrl)
        ws.send()
      }).should.throw('Failed to execute \'send\' on \'WebSocket\': 1 argument required, but only 0 present.')
    })

    it('should work in a web worker')
    it('should work with different binary types')
    it('should support the protocols parameter')
  })

  describe('robustness', function() {
    it('should reconnect when a server reboots (1011)', function() {
      ws = new RobustWebSocket(serverUrl + '/?exitCode=1011&exitMessage=alldone')
      ws.onclose = sinon.spy(function(evt) {
        evt.code.should.equal(1011)
        evt.reason.should.equal('alldone')
      })
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.callCount.should.be.greaterThan(2)
        ws.onclose.callCount.should.be.greaterThan(1)
      })
    })

    it('should not reconnect on normal disconnects (1000)', function() {
      ws = new RobustWebSocket(serverUrl + '/?exitCode=1000&exitMessage=alldone')
      ws.onclose = sinon.spy(function(evt) {
        evt.code.should.equal(1000)
        evt.reason.should.equal('alldone')
      })
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onclose.should.have.been.calledOnce
        ws.onopen.should.have.been.calledOnce
        ws.readyState.should.equal(WebSocket.CLOSED)
      }).then(function() {
        return Promise.delay(1000)
      }).then(function() {
        ws.onclose.should.have.been.calledOnce
        ws.onopen.should.have.been.calledOnce
        ws.readyState.should.equal(WebSocket.CLOSED)
      })
    })

    it('should emit connecting events when reconnecting (1001)')
    it('should retry the initial connection if it failed')
    it('should not try to disconnect while offline, trying again when online')
    it('should try to reconnect with an exponential backoff')
    it('should allow a reconnect delay to be configured')
  })
})