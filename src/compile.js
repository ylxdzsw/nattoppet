'use strict'

const co = require('co')

module.exports = co.wrap(function*(info){
    console.log(info)
})
