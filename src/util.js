var fs = require('mz/fs')
var co = require('co')
var path = require('path')

walk = co.wrap(function*(dir, f){
    (yield fs.readdir(dir))
        .filter(x => x[0] != '.')
        .map(x => path.join(dir, x))
        .forEach(co.wrap(function*(x){
            var stat = yield fs.stat(x)
            if(stat.isDirectory()){
                yield f(x, 'dir').catch(error)
                yield walk(x, f)
            }else{
                yield f(x, 'file').catch(error)
            }
        }))
})

error = err => console.error(err.stack)||err

module.exports = {
    walk: walk,
    error: error
}
