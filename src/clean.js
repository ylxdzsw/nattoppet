'use strict'

const path = require('path')
const fs = require('mz/fs')
const co = require('co')

const util = require('./util.js')

module.exports = co.wrap(function*(opt){
    const dest = opt.dir || '.'
    yield fs.rmdir(path.join(dest, '_site')).catch(function(err){
        switch(err.code){
            case 'ENOENT':
                break
            default:
                util.error(err)
        }
    })
    console.info('清理完毕～')
})
