var fs = require('mz/fs')
var co = require('co')
var path = require('path')

walk = co.wrap(function*(dir, f){
    yield (yield fs.readdir(dir))
        .filter(x => x[0] != '.')
        .map(x => path.join(dir, x))
        .map(co.wrap(function*(x){
            var stat = yield fs.stat(x)
            if(stat.isDirectory()){
                yield f(x, 'dir').catch(error)
                yield walk(x, f)
            }else{
                yield f(x, 'file').catch(error)
            }
        }))
})

error = function(err){
    if(!err.printed){
        console.error(err.stack)
        err.printed = true
    }
    throw err
}

module.exports = {
    walk: walk,
    error: error
}
