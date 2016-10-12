module.exports = function(grunt) {
  const
    url = require('url'),
    qs = require('qs'),
    ws = require('ws'),
    ErrorCodes = require(require.resolve('ws').replace('index.js', 'lib/ErrorCodes'))

  // stub this out so we can do more through testing on the client side
  ErrorCodes.isValidErrorCode = () => true

  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: '',
          port: 9999,
          keepalive: !!process.env.KEEPALIVE,
          onCreateServer: function(server/*, connect, options*/) {
            const wss = new ws.Server({ server })
            wss.on('connection', function (socket) {
              var path = url.parse(socket.upgradeReq.url),
                  query = qs.parse(path.query)

              socket.on('message', function (message) {
                if (path.pathname.startsWith('/echo')) {
                  socket.send(message)
                }
              })

              if (query.greet) {
                socket.send(query.greet)
              }

              if (query.exitCode) {
                setTimeout(function() {
                  console.log('closing connection with code %d, message %s', query.exitCode, query.exitMessage)
                  socket.close(Number(query.exitCode), query.exitMessage)
                }, Number(query.delay || 500))
              }
            })
          }
        }
      }
    },
    'saucelabs-custom': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/test/tests.html'],
          tunnelTimeout: 5,
          build: process.env.CIRCLE_SHA1 || 0,
          concurrency: 3,
          tunnelArgs: ['--vm-version', 'dev-varnish'],
          browsers: [{
            browserName: 'iphone',
            platform: 'OS X 10.10',
            version: '9.3'
          }, {
            browserName: 'safari',
            platform: 'OS X 10.11',
            version: '9'
          }, {
            browserName: 'safari',
            version: '8'
          }, {
            browserName: 'android',
            platform: 'Linux',
            version: '5.0'
          }, {
            browserName: 'googlechrome',
            platform: 'linux'
          }, {
            browserName: 'firefox',
            platform: 'linux'
          // }, {
          //   browserName: 'microsoftedge',
          //   platform: 'win10'
          }, {
            browserName: 'internet explorer',
            version: '11'
          }],
          testname: 'RobustWebSocket tests',
          tags: [process.env.CIRCLE_BRANCH || 'local']
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-saucelabs')
  grunt.loadNpmTasks('grunt-contrib-connect')

  grunt.registerTask('test', ['connect', 'saucelabs-custom'])
}