module.exports = function(grunt) {
  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: '',
          port: 9999
        }
      }
    },
    'saucelabs-custom': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/tests/tests.html'],
          tunnelTimeout: 5,
          build: process.env.CIRCLE_BUILD_NUM || 0,
          concurrency: 3,
          browsers: [{
            browserName: 'iphone',
            platform: 'OS X 10.10',
            version: '7.1'
          }, {
            browserName: 'iphone',
            platform: 'OS X 10.10',
            version: '8.2'
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
            version: '4.0'
          }, {
            browserName: 'googlechrome',
            platform: 'linux'
          }, {
            browserName: 'firefox',
            platform: 'WIN7',
          }, {
            browserName: 'internet explorer',
            platform: 'WIN8.1',
            version: '11'
          }, {
            browserName: 'internet explorer',
            platform: 'WIN8',
            version: '10'
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