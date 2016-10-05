(function(global) {

  if (typeof global.CustomEvent === 'function') return

  function CustomEvent(event, params) {
    params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
    }
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = global.Event.prototype

  global.CustomEvent = CustomEvent
})(this)