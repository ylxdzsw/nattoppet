var co = require('co')

var analyze = require('./analyze.js')
var compile = require('./compile.js')

module.exports = co.wrap(function*(){
    yield analyze('.')
    yield compile('.')
})
