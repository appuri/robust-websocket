(function(factory, global) {
  if (typeof define === 'function' && define.amd) {
    define(factory)
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else {
    global.RobustWebsocket = factory()
  }
})(function() {

  function inherit(child, parent) {
    for (var key in parent) {
      if (parent.hasOwnProperty(key)) child[key] = parent[key];
    }

    function ctor() {
      this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
  }

  var standardEvents = ['open', 'close', 'message', 'error']

  var RobustWebsocket = function(url, opts) {
    var realWs, self = this

    function newWebSocket() {
      realWs = new WebSocket(url)
      realWs.binaryType = self.binaryType

      standardEvents.forEach(function(e) {
        realWs.addEventListener(e, function() {
          var cb = self['on' + e]
          if (typeof cb === 'function') {
            return cb.apply(self, arguments)
          }
        })
      })
    }

    ['bufferedAmount', 'url', 'readyState', 'protocol', 'extensions'].forEach(function(readOnlyProp) {
      Object.defineProperty(self, readOnlyProp, {
        get: function() { return realWs[readOnlyProp] }
      })
    })

    ;['send', 'close'].forEach(function(method) {
      self[method] = function() {
        return realWs[method].apply(realWs, arguments)
      }
    })

    realWs = newWebSocket()
  }

  inherit(RobustWebsocket, EventTarget)

  RobustWebsocket.prototype.binaryType = 'blob'

}, typeof window !== 'undefined' ? window : this)