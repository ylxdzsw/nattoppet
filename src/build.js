'use strict'

const co = require('co')
const fs = require('mz/fs')
const path = require('path')

const analyze = require('./analyze.js')
const compile = require('./compile.js')
const util = require('./util.js')

module.exports = co.wrap(function*(opt){
    const dest = opt.dir || '.'
    if([
        yield fs.stat(path.join(dest, 'posts')).catch(util.nil),
        yield fs.stat(path.join(dest, 'nattoppet')).catch(util.nil),
        yield fs.stat(path.join(dest, 'index.html')).catch(util.nil)
    ].some(x=>x)){
        util.error(new Error('请先执行 nattoppet clean'))
    }else{
        yield fs.mkdir(path.join(dest, 'posts')).catch(util.error),
        yield fs.mkdir(path.join(dest, 'nattoppet')).catch(util.error)
    }
    yield compile(dest, yield analyze(dest))
    console.info("构建完毕～")
})
