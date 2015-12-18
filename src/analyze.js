var path = require('path')
var fs = require('mz/fs')
var co = require('co')

var util = require('./util.js')

addPost = co.wrap(function*(post, result){
    var id = path.basename(post)
    if(result.posts[id]){
        throw new Error("duplicate post id!")
    }
    var info = yield readJson(path.join(post, 'post.json'))
    result.posts[id] = {
        id: id,
        addr: post,
        info: info
    }
})

module.exports = co.wrap(function*(root){
    var result = {} // use object rather than Map to get better JSON compatibility

    // get all posts
    result.posts = Object.create(null) // as these object will be "for in"
    yield util.walk(root, co.wrap(function*(x, type){
        if(type == 'dir' && (yield isPost(x))){
            yield addPost(x, result)
        }
    }))

    // postlist
    result.postlist = []
    for(var id in result.posts){
        result.postlist.push(id)
    }

    // byLabel
    result.byLabel = Object.create(null)
    result.postlist.forEach(function(id){
        result.posts[id].info.label.forEach(function(label){
            if(result.byLabel[label]){
                result.byLabel[label].push(id)
            }else{
                result.byLabel[label] = [id]
            }
        })
    })

    // byDate
    result.byDate = Object.create(null)
    result.postlist.forEach(function(id){
        var date = result.posts[id].info.date.split('-').slice(0,2).join('-')
        if(result.byDate[date]){
            result.byDate[date].push(id)
        }else{
            result.byDate[date] = [id]
        }
    })

    return result
})

isPost = co.wrap(function*(dir){
    return yield fs.stat(path.join(dir,'post.json')).catch(()=>null)
})

readJson = co.wrap(function*(file){
    var json = yield fs.readFile(file)
    return JSON.parse(json)
})
