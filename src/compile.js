'use strict'

const path = require('path')
const fs = require('mz/fs')
const cp = require('mz/child_process')
const co = require('co')

const util = require('./util.js')

const copyPosts = co.wrap(function*(root, info){
    yield info.postlist.map(post => {
        let src = info.posts[post].addr
        let dest = path.join(root, '_site', post)
        return cp.exec(['cp', '-r', src, dest].join(' ')).catch(util.error)
    })
})

const delExtra = co.wrap(function*(root, info){
    yield info.postlist
        .map(post => info.posts[post])
        .filter(post => post.info['no-copy'] && post.info['no-copy'].length)
        .map(post => co(function*(){
            yield post.info['no-copy'].map(file => fs.unlink(path.join(root, '_site', post.id, file)).catch(util.error))
        }).catch(util.error))
})

module.exports = co.wrap(function*(root, info){
    yield copyPosts(root, info).catch(util.error)
    yield delExtra(root, info).catch(util.error)
})
