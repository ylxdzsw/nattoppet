'use strict'

const path = require('path')
const fs = require('mz/fs')
const cp = require('mz/child_process')
const co = require('co')

const util = require('./util.js')

// polyfill for Array.prototype.includes
Array.prototype.includes||(Array.prototype.includes=function(r){var t=Object(this),e=parseInt(t.length)||0;if(0===e)return!1;var n,a=parseInt(arguments[1])||0;a>=0?n=a:(n=e+a,0>n&&(n=0));for(var s;e>n;){if(s=t[n],r===s||r!==r&&s!==s)return!0;n++}return!1});

const copyPosts = co.wrap(function*(root, info){
    yield info.postlist.map(post => {
        const src = info.posts[post].addr
        const dest = path.join(root, '_site', post)
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

const replaceVar = co.wrap(function*(root, info){
    yield util.walk(path.join(root, '_site'), co.wrap(function*(x, type){
        if(type == 'file' && isText(x)){
            yield fs.writeFile(x,
                (yield fs.readFile(x, 'utf8').catch(util.error))
                    .replace(buildReg("Template.post.layout.dir"),
                        getVar["Template.post.layout.dir"]())

            ).catch(util.error)
        }
    })).catch(util.error)
})

module.exports = co.wrap(function*(root, info){
    yield copyPosts(root, info).catch(util.error)
    yield delExtra(root, info).catch(util.error)
    yield replaceVar(root, info).catch(util.error)
    console.info('编译完毕～')
})

const getVar = {
    "Template.post.layout.dir": function(){
        return path.join(__dirname, '..', 'template', 'post.jade')
    }
}

const buildReg = util.memo(function(str){
    str = str.replace(/\./g,'\\.')
    return new RegExp('(nattoppet::'+str+')|("-nattoppet::'+str+'-")','g')
})

const isText = function(file){
    const textSuffixes = ['jade','less','coffee','html','css','js','txt','md','markdown','json','xml','xaml','yml','ini','config','gitignore']
    return textSuffixes.includes(path.extname(file).slice(1).toLowerCase())
}
