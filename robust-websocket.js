(function(factory, global) {
  if (typeof define === 'function' && define.amd) {
    define(factory)
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else {
    global.RobustWebSocket = factory()
  }
})(function() {

  var RobustWebSocket = function(url, protocols, userOptions) {
    var realWs, connectTimeout,
        self = this,
        attempts = 0,
        reconnects = -1,
        opts = Object.assign({
          timeout: 4000,
          reconnectStrategy: function(ws) {
            return [0, 3000, 10000][ws.attempts]
          }
        }, userOptions)

    if (typeof opts.timeout !== 'number') {
      throw new Error('timeout must be the number of milliseconds to timeout a connection attempt')
    }

    if (typeof opts.reconnectStrategy !== 'function') {
      throw new Error('reconnectStrategy must be a function that returns the number of milliseconds to wait for a reconnect attempt, or null or undefined to not reconnect.')
    }

    ;['bufferedAmount', 'url', 'readyState', 'protocol', 'extensions'].forEach(function(readOnlyProp) {
      Object.defineProperty(self, readOnlyProp, {
        get: function() { return realWs[readOnlyProp] }
      })
    })

    ;['send', 'close'].forEach(function(method) {
      self[method] = function() {
        return realWs[method].apply(realWs, arguments)
      }
    })

    function onclose(event) {
      if (event.code === 1000) return

      var delay = opts.reconnectStrategy(self, event)
      if (typeof delay === 'number') {
        setTimeout(newWebSocket, delay)
      }
    }

    Object.defineProperty(self, 'listeners', {
      value: {
        open: [function(event) {
          if (connectTimeout) {
            clearTimeout(connectTimeout)
            connectTimeout = null
          }
          event.reconnects = ++reconnects
          event.attempts = attempts
          attempts = 0
        }],
        close: [onclose],
        error: [function(e) {
          console.log('error (reconnects %d, attempts %d)', reconnects, attempts)
          console.dir(e)
        }]
      }
    })

    Object.defineProperty(self, 'attempts', {
      get: function() { return attempts },
      enumerable: true
    })

    Object.defineProperty(self, 'reconnects', {
      get: function() { return reconnects },
      enumerable: true
    })

    function newWebSocket() {
      realWs = new WebSocket(url, protocols)
      realWs.binaryType = self.binaryType

      attempts++
      self.dispatchEvent(new CustomEvent('connecting', {
        attempts: attempts,
        reconnects: reconnects
      }))

      connectTimeout = setTimeout(function() {
        connectTimeout = null
        self.dispatchEvent(new CustomEvent('timeout', {
          attempts: attempts,
          reconnects: reconnects
        }))
      }, opts.timeout)

      ;['open', 'close', 'message', 'error'].forEach(function(stdEvent) {
        realWs.addEventListener(stdEvent, function(event) {
          self.dispatchEvent(event)

          var cb = self['on' + stdEvent]
          if (typeof cb === 'function') {
            return cb.apply(self, arguments)
          }
        })
      })
    }

    newWebSocket()
  }

  RobustWebSocket.prototype.binaryType = 'blob'

  // Taken from MDN https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  RobustWebSocket.prototype.addEventListener = function(type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = []
    }
    this.listeners[type].push(callback)
  }

  RobustWebSocket.prototype.removeEventListener = function(type, callback) {
    if (!(type in this.listeners)) {
      return
    }
    var stack = this.listeners[type]
    for (var i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1)
        return
      }
    }
  }

  RobustWebSocket.prototype.dispatchEvent = function(event) {
    if (!(event.type in this.listeners)) {
      return
    }
    event.currentTarget = this
    var stack = this.listeners[event.type]
    for (var i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event)
    }
  }

  return RobustWebSocket
}, this)