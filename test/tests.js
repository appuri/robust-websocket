describe('Robust Websocket', function() {
  describe('web standards behavior', function() {
    it('should open a connection when initialized, emitting events')
    it('should forward messages and errors to the client via event listeners')
    it('should forward messages and errors to the client via on* properties')
    it('should proxy close and send methods')
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