'use strict'

const path = require('path')
const del = require('del')
const co = require('co')

const util = require('./util.js')

module.exports = co.wrap(function*(opt){
    const dest = opt.dir || '.'
    yield [
        del(path.join(dest, 'posts')).catch(util.error),
        del(path.join(dest, 'nattoppet')).catch(util.error),
        del(path.join(dest, 'index.html')).catch(util.error),
    ]
    console.info('清理完毕～')
})
