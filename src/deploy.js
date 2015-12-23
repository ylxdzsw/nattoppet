'use strict'

const path = require('path')
const cp = require('mz/child_process')
const co = require('co')

const util = require('./util.js')

module.exports = co.wrap(function*(){
    const options = {
        cwd: path.resolve('.')
    }
    yield cp.exec('git add -A', options).catch(util.error)
    yield cp.exec('git commit -m "update"', options).catch(util.error)
    yield cp.exec('git push origin master', options).catch(util.error)
    console.log("部署完毕～")
})
