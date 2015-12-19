'use strict'

const path = require('path')
const fs = require('mz/fs')
const co = require('co')

const util = require('./util.js')

const addPost = co.wrap(function*(post, result){
    const id = path.basename(post)
    if(result.posts[id]){
        throw new Error("duplicate post id!")
    }
    const info = yield readJson(path.join(post, 'post.json'))
    result.posts[id] = {
        id: id,
        addr: post,
        info: info
    }
})

const getPosts = co.wrap(function*(dir, result){
    result.posts = Object.create(null) // as these objects will be "for in" later
    yield util.walk(dir, co.wrap(function*(x, type){
        if(type == 'dir' && (yield isPost(x))){
            yield addPost(x, result)
        }
    }))
})

const genPostList = function(result){
    result.postlist = []
    for(let id in result.posts){
        result.postlist.push(id)
    }
}

const genByLabel = function(result){
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
}

const genByDate = function(result){
    result.byDate = Object.create(null)
    result.postlist.forEach(function(id){
        const date = result.posts[id].info.date.split('-').slice(0,2).join('-')
        if(result.byDate[date]){
            result.byDate[date].push(id)
        }else{
            result.byDate[date] = [id]
        }
    })
}

module.exports = co.wrap(function*(root){
    const result = {} // use object rather than Map to get better JSON compatibility
    yield getPosts(root, result)
    genPostList(result)
    genByLabel(result)
    genByDate(result)
    return result
})

const isPost = co.wrap(function*(dir){
    return yield fs.stat(path.join(dir,'post.json')).catch(util.nil)
})

const readJson = co.wrap(function*(file){
    const json = yield fs.readFile(file)
    return JSON.parse(json)
})
