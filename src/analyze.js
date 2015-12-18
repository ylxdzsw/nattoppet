var path = require('path')
var fs = require('mz/fs')
var co = require('co')

var util = require('./util.js')

module.exports = co.wrap(function*(root){
    util.walk(root, co.wrap(function*(x, type){
        return yield co(function*(){
            return console.log(x,type)
        })
    }))
})

isPost = co.wrap(function*(dir){
    return yield fs.stat(path.join(dir,'post.json')).catch(util.error)
})
