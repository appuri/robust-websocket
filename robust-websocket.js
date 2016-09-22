(function(factory, global) {
  if (typeof define === 'function' && define.amd) {
    define(factory)
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else {
    global.RobustWebSocket = factory()
  }
})(function() {

  var RobustWebSocket = function(url, opts) {
    var realWs, self = this

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
    }

    Object.defineProperty(self, 'listeners', {
      value: {
        close: [onclose]
      }
    })

    function newWebSocket() {
      realWs = new WebSocket(url)
      realWs.binaryType = self.binaryType

      ;['open', 'close', 'message', 'error'].forEach(function(stdEvent) {
        realWs.addEventListener(stdEvent, function(evt) {
          self.dispatchEvent(evt)

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
    var stack = this.listeners[event.type]
    for (var i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event)
    }
  }

  return RobustWebSocket
}, typeof window !== 'undefined' ? window : this)