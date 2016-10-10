(function(global) {

  if (typeof global.CustomEvent === 'function') return

  function CustomEvent(event, params) {
    params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
    }

    var evt
    if (typeof document !== 'undefined') {
      evt = document.createEvent('CustomEvent')
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    } else {
      // This is not a proper polyfill at all. If you need a CustomEvent in a WebWorker,
      // please benefit the rest of the world and submit a pull request to your favorite
      // CustomEvent polyfil like https://github.com/kaesetoast/customevent-polyfill/issues/1
      evt = {
        type: event,
        detail: params.detail,
        bubbles: false,
        cancelable: false,
        preventDefault: function() {},
        stopPropagation: function() {}
      }
    }

    return evt
  }

  if (global.Event) {
    CustomEvent.prototype = global.Event.prototype
  }

  global.CustomEvent = CustomEvent
})(this)