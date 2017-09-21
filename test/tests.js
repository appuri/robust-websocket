describe('RobustWebSocket', function() {
  var ws, serverUrl = location.origin.replace('http', 'ws'),
      isSafari = window.webkitCancelAnimationFrame && !window.webkitRTCPeerConnection,
      isIE = Object.hasOwnProperty.call(window, 'ActiveXObject'),
      isEdge = !!window.MSStream,
      isIEOrEdge = isIE || isEdge

  this.retries(3)

  afterEach(function() {
    Mocha.onLine = true
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
      ws.url.should.contain(serverUrl)
      ws.protocol.should.equal('')
      ws.readyState.should.equal(WebSocket.CONNECTING)
      ws.bufferedAmount.should.equal(0)

      return pollUntilPassing(function() {
        ws.readyState.should.equal(WebSocket.OPEN)
      })
    })

    it('should rethrow errors', !isIEOrEdge && function() {
      (function() {
        new RobustWebSocket('localhost:11099')
      }).should.throw(Error)

      ;(function() {
        ws = new RobustWebSocket(serverUrl)
        ws.send()
      }).should.throw(Error)
    })

    it('should work in a web worker', !isSafari && !isEdge && function(done) {
      var worker = new Worker('./webworker.js')

      worker.onmessage = function(event) {
        event.data.should.equal('howdy')
        done()
      }
    })

    it('should work with different binary types')
    it('should support the protocols parameter')
  })

  function shouldNotReconnect(code) {
    return function() {
      ws = new RobustWebSocket(serverUrl + '/?exitCode=' + code + '&exitMessage=alldone')
      ws.onclose = sinon.spy(function(evt) {
        if (!isIEOrEdge) {
          evt.code.should.equal(code)
          evt.reason.should.equal('alldone')
        }
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
    }
  }

  describe('robustness', function() {
    it('should reconnect when a server reboots (1012)', function() {
      ws = new RobustWebSocket(serverUrl + '/?exitCode=1012&exitMessage=alldone&delay=250')
      ws.onclose = sinon.spy(function(evt) {
        if (!isIEOrEdge) {
          evt.code.should.equal(1012)
          evt.reason.should.equal('alldone')
        }
      })
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.callCount.should.be.greaterThan(2)
        ws.onclose.callCount.should.be.greaterThan(1)
      })
    })

    it('should not reconnect on normal disconnects (1000)', !isIEOrEdge && shouldNotReconnect(1000))

    it('should call shouldReconnect on normal disconnects if handle1000 is true', !isIEOrEdge && function() {
      // Issue #14
      var attemptLog = [],
      rounds = 0,
      shouldReconnect = sinon.spy(function(event, ws) {
        event.type.should.equal('close')
        event.currentTarget.should.be.instanceof(WebSocket)
        // ws.attempts is reset on each successful open, so we separately track the number of open-close
        // cycles using `rounds`
        attemptLog.push(ws.attempts)
        return rounds++ < 2 && 100
      })
      shouldReconnect.handle1000 = true;

      ws = new RobustWebSocket(serverUrl + '/?exitCode=1000&exitMessage=alldone&delay=250', null, {
        shouldReconnect: shouldReconnect
      })
      ws.onclose = sinon.spy(function(evt) {
        evt.code.should.equal(1000)
      })
      return pollUntilPassing(function() {
        attemptLog.should.deep.equal([0, 0, 0])
        ws.onclose.should.have.been.calledThrice
        shouldReconnect.should.have.been.calledThrice
        ws.readyState.should.equal(WebSocket.CLOSED)
      })
    })

    it('should not reconnect 1008 by default (HTTP 400 equvalent)', !isIEOrEdge && shouldNotReconnect(1008))
    it('should not reconnect 1011 by default (HTTP 500 equvalent)', !isIEOrEdge && shouldNotReconnect(1011))

    it('should emit connecting events when reconnecting (1001)', function() {
      ws = new RobustWebSocket(serverUrl + '/?exitCode=1001')
      ws.onclose = sinon.spy(function(evt) {
        !isIEOrEdge && evt.code.should.equal(1001)
        evt.reason.should.equal('')
      })

      var reconnectingListener = sinon.spy()
      ws.addEventListener('connecting', reconnectingListener)

      return pollUntilPassing(function() {
        reconnectingListener.should.have.been.called
        var event = reconnectingListener.lastCall.args[0]
        event.type.should.equal('connecting')
        event.attempts.should.equal(1)
      })
    })

    // Safari never calls the onerror callback. The connection will just timeout in that case.
    it('should retry the initial connection if it failed', !isSafari && function() {
      var attemptLog = [],
      shouldReconnect = sinon.spy(function(event, ws) {
        event.type.should.equal('close')
        event.currentTarget.should.be.instanceof(WebSocket)
        // since ws.attempts refers to the current attempts on the websocket, we need to save them
        // rather than use sinon.firstCall.args[0].attempts
        attemptLog.push(ws.attempts)
        return ws.attempts < 3 && 500
      })

      ws = new RobustWebSocket('ws://localhost:88', null, {
        shouldReconnect: shouldReconnect
      })
      ws.onclose = sinon.spy(function(evt) {
        evt.code.should.equal(1006)
        evt.reason.should.equal('')
      })
      ws.onerror = sinon.spy(function(e) {
        e.type.should.equal('error')
      })

      return pollUntilPassing(function() {
        ws.onerror.should.have.been.calledThrice
        ws.onclose.should.have.been.calledThrice
        shouldReconnect.should.have.been.calledThrice
        ws.readyState.should.equal(WebSocket.CLOSED)

        attemptLog.should.deep.equal([1, 2, 3])
      }).then(function() {
        return Promise.delay(1500)
      }).then(function() {
        ws.onclose.should.have.been.calledThrice
        ws.readyState.should.equal(WebSocket.CLOSED)
      })
    })

    it('should not try to reconnect while offline, trying again when online', function() {
      this.timeout(8000)
      Mocha.onLine = false
      var shouldReconnect = sinon.spy(function() { return 0 })

      ws = new RobustWebSocket(serverUrl + '/?exitCode=1002&delay=500', null, shouldReconnect)
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.should.have.been.calledOnce
        shouldReconnect.should.have.not.been.called
      }).then(function() {
        return Promise.delay(1000)
      }).then(function() {
        ws.onopen.should.have.been.calledOnce
        shouldReconnect.should.have.not.been.called

        Mocha.onLine = true
        window.dispatchEvent(new CustomEvent('online'))

        return pollUntilPassing(function() {
          shouldReconnect.should.have.been.calledOnce
          ws.onopen.should.have.been.calledTwice
        })
      })
    })

    it('should immediately close the websocket when going offline rather than waiting for a timeout', function() {
      this.timeout(8000)
      var shouldReconnect = sinon.spy(function() { return 0 })

      ws = new RobustWebSocket(serverUrl + '/echo', null, shouldReconnect)
      ws.onopen = sinon.spy()
      ws.onclose = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.should.have.been.calledOnce
        shouldReconnect.should.have.not.been.called
      }).then(function() {
        return Promise.delay(100)
      }).then(function() {
        window.dispatchEvent(new CustomEvent('offline'))
        return pollUntilPassing(function() {
          ws.onclose.should.have.been.calledOnce
          ws.readyState.should.equal(WebSocket.CLOSED)
        })
      }).then(function() {
        return Promise.delay(1000)
      }).then(function() {
        ws.onclose.should.have.been.calledOnce
        ws.readyState.should.equal(WebSocket.CLOSED)

        window.dispatchEvent(new CustomEvent('online'))
        return pollUntilPassing(function() {
          ws.onopen.should.have.been.calledTwice
          shouldReconnect.should.have.been.calledOnce
        })
      }).then(function() {
        return Promise.delay(1000)
      }).then(function() {
        ws.onopen.should.have.been.calledTwice
        shouldReconnect.should.have.been.calledOnce
        ws.readyState.should.equal(WebSocket.OPEN)
      })
    })

    it('should not reconnect a websocket that was explicitly closed when going back online', function() {
      ws = new RobustWebSocket(serverUrl + '/echo', null, function() { return 0 })
      ws.onopen = sinon.spy()
      ws.onclose = sinon.spy()

      return pollUntilPassing(function() {
        ws.readyState.should.equal(WebSocket.OPEN)
      }).then(function() {
        Mocha.onLine = false
        ws.close()

        return pollUntilPassing(function() {
          ws.readyState.should.equal(WebSocket.CLOSED)
          ws.onclose.should.have.been.calledOnce
        })
      }).then(function() {
        return Promise.delay(300)
      }).then(function() {
        window.dispatchEvent(new CustomEvent('online'))
        return Promise.delay(500)
      }).then(function() {
        ws.onclose.should.have.been.calledOnce
        ws.onclose.should.have.been.calledOnce
      })
    })
  })

  describe('extra features', function() {
    it('should emit a timeout event if the connection timed out')

    it('should allow the socket to be reopened', function() {
      ws = new RobustWebSocket(serverUrl + '/echo')
      ws.onclose = sinon.spy()
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.should.have.been.calledOnce
        ws.onclose.should.have.not.been.called
        ws.readyState.should.equal(WebSocket.OPEN)
      }).then(function() {
        ws.close()

        return pollUntilPassing(function() {
          ws.onopen.should.have.been.calledOnce
          ws.onclose.should.have.been.calledOnce
          ws.readyState.should.equal(WebSocket.CLOSED)
        })
      }).then(function() {
        return Promise.delay(100)
      }).then(function() {
        ws.open()

        return pollUntilPassing(function() {
          ws.onopen.should.have.been.calledTwice
          ws.onclose.should.have.been.calledOnce
          ws.readyState.should.equal(WebSocket.OPEN)
        })
      })
    })

    it('should not reconnect if the socket is already opened when open is called', function() {
      ws = new RobustWebSocket(serverUrl + '/echo')
      ws.onclose = sinon.spy()
      ws.onopen = sinon.spy()

      return pollUntilPassing(function() {
        ws.onopen.should.have.been.calledOnce
        ws.readyState.should.equal(WebSocket.OPEN)
      }).then(function() {
        return Promise.delay(100)
      }).then(function() {
        ws.open()
        return Promise.delay(300)
      }).then(function() {
        ws.onopen.should.have.been.calledOnce
        ws.onclose.should.have.not.been.called
        ws.readyState.should.equal(WebSocket.OPEN)
      })
    })

    it('should not automatically open the connection if requested', function() {
      ws = new RobustWebSocket(serverUrl + '/echo', null, {
        automaticOpen: false
      })
      ws.onclose = sinon.spy()
      ws.onopen = sinon.spy()

      return Promise.delay(400).then(function() {
        ws.onopen.should.have.not.been.called
        ws.onclose.should.have.not.been.called
        should.not.exist(ws.readyState)

        ws.open()

        return pollUntilPassing(function() {
          ws.onopen.should.have.been.calledOnce
          ws.readyState.should.equal(WebSocket.OPEN)
        })
      })
    })

    it('should not close a socket if ignoreConnectivityEvents is in use', function() {
      ws = new RobustWebSocket(serverUrl + '/echo', null, {
        ignoreConnectivityEvents: true,
        shouldReconnect: function() { return 0 }
      })
      ws.onclose = sinon.spy()

      return pollUntilPassing(function() {
        ws.readyState.should.equal(WebSocket.OPEN)
      }).then(function() {
        Mocha.onLine = false

        return Promise.delay(300)
      }).then(function() {
        ws.readyState.should.equal(WebSocket.OPEN)
        ws.onclose.should.not.have.been.called
      })
    })
  })
})