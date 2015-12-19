'use strict'

const fs = require('mz/fs')
const co = require('co')
const path = require('path')

const walk = co.wrap(function*(dir, f){
    yield (yield fs.readdir(dir))
        .filter(x => x[0] != '.')
        .map(x => path.join(dir, x))
        .map(co.wrap(function*(x){
            const stat = yield fs.stat(x)
            if(stat.isDirectory()){
                yield f(x, 'dir').catch(error)
                yield walk(x, f)
            }else{
                yield f(x, 'file').catch(error)
            }
        }))
})

const error = function(err){
    if(!err.printed){
        console.error(err.stack)
        err.printed = true
    }
    throw err
}

const nil = function(){}

module.exports = {
    walk: walk,
    error: error,
    nil: nil
}
