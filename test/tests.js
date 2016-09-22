describe('RobustWebSocket', function() {
  var ws
  afterEach(function() {
    try {
      ws && ws.close()
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
      ws = new RobustWebSocket('ws://localhost:11099/echo')

      ws.addEventListener('open', wrap(function(evt) {
        this.should.equal(ws)
        evt.target.should.be.instanceof(WebSocket)
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

    it('should forward messages and errors to the client via on* properties')
    it('should proxy read only properties')
    it('should rethrow errors when instantiated')
    it('should work in a web worker')
    it('should work with different binary types')
  })

  describe('robustness', function() {
    it('should reconnect on abnormal disconnects (1006)')
    it('should not reconnect on normal disconnects (1000)')
    it('should emit connecting events when reconnecting (1001)')
    it('should not try to disconnect while offline, trying again when online')
    it('should try to reconnect with an exponential backoff')
    it('should allow a reconnect delay to be configured')
  })
})