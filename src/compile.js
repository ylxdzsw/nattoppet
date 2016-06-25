'use strict'

const path = require('path')
const fs = require('mz/fs')
const cp = require('mz/child_process')
const co = require('co')
const jade = require('jade')
const less = require('less')
const coffee = require('coffee-script')

const util = require('./util.js')

// polyfill for Array.prototype.includes
Array.prototype.includes||(Array.prototype.includes=function(r){var t=Object(this),e=parseInt(t.length)||0;if(0===e)return!1;var n,a=parseInt(arguments[1])||0;a>=0?n=a:(n=e+a,0>n&&(n=0));for(var s;e>n;){if(s=t[n],r===s||r!==r&&s!==s)return!0;n++}return!1});

const copyPosts = co.wrap(function*(root, info){
    yield info.postlist.map(post => {
        const src = info.posts[post].addr
        const dest = path.join(root, 'posts', post)
        return cp.execSync(['cp', '-r', src, dest].join(' '))
    })
})

const replaceVar = co.wrap(function*(root, info){
    const isText = hasExtname(new Set(['jade','less','coffee','html','css','js','md','json']))
    yield util.walk(path.join(root, 'posts'), co.wrap(function*(x, type){
        if(type == 'file' && isText(x)){
            const input = yield fs.readFile(x, 'utf8').catch(util.error)
            const result = input.replace(buildReg("Template.dir"),getVar["Template.dir"](path.dirname(x)))
            yield fs.writeFile(x,result).catch(util.error)
        }
    })).catch(util.error)
})

const compileJade = co.wrap(function*(root, info){
    const isJade = hasExtname('jade')
    yield info.postlist.map(function(post){
        const shouldCompile = shouldCompileIn(post, root, info)
        return util.walk(path.join(root, 'posts', post), co.wrap(function*(x, type){
            if(type == 'file' && isJade(x) && shouldCompile(x)){
                const input = yield fs.readFile(x, 'utf8').catch(util.error)
                const result = jade.compile(input, {filename: x})({data: info.posts[post]})
                const dest = path.join(path.dirname(x), path.parse(x).name+'.html')
                yield fs.writeFile(dest,result).catch(util.error)
                yield fs.unlink(x).catch(util.error)
            }
        })).catch(util.error)
    })
})

const compileLess = co.wrap(function*(root, info){
    const isLess = hasExtname('less')
    yield info.postlist.map(function(post){
        const shouldCompile = shouldCompileIn(post, root, info)
        return util.walk(path.join(root, 'posts', post), co.wrap(function*(x, type){
            if(type == 'file' && isLess(x) && shouldCompile(x)){
                const input = yield fs.readFile(x, 'utf8').catch(util.error)
                const result = (yield less.render(input).catch(util.error)).css
                const dest = path.join(path.dirname(x), path.parse(x).name+'.css')
                yield fs.writeFile(dest,result).catch(util.error)
                yield fs.unlink(x).catch(util.error)
            }
        })).catch(util.error)
    })
})

const compileCoffee = co.wrap(function*(root, info){
    const isCoffee = hasExtname('coffee')
    yield info.postlist.map(function(post){
        const shouldCompile = shouldCompileIn(post, root, info)
        return util.walk(path.join(root, 'posts', post), co.wrap(function*(x, type){
            if(type == 'file' && isCoffee(x) && shouldCompile(x)){
                const input = yield fs.readFile(x, 'utf8').catch(util.error)
                const result = coffee.compile(input)
                const dest = path.join(path.dirname(x), path.parse(x).name+'.js')
                yield fs.writeFile(dest,result).catch(util.error)
                yield fs.unlink(x).catch(util.error)
            }
        })).catch(util.error)
    })
})

const delExtra = co.wrap(function*(root, info){
    yield info.postlist
        .map(post => info.posts[post])
        .filter(post => post.info['no-copy'] && post.info['no-copy'].length)
        .map(post => co(function*(){
            yield post.info['no-copy'].map(file => fs.unlink(path.join(root, 'posts', post.id, file)).catch(util.error))
        }).catch(util.error))
    yield util.walk(path.join(root, 'posts'), co.wrap(function*(x, type){
        if(type == 'file' && path.basename(x) == 'post.json'){
            yield fs.unlink(x).catch(util.error)
        }
    })).catch(util.error)
})

const compileIndex = co.wrap(function*(root, info){
    const source = path.join(__dirname, '..', 'templates', 'index', 'index.jade')
    const input = yield fs.readFile(source, 'utf8').catch(util.error)
    const result = jade.compile(input, {filename: source})({data: info})
    const dest = path.join(root, 'index.html')
    yield fs.writeFile(dest, result).catch(util.error)
})

const compileThemes = co.wrap(function*(root, info){
    const files = yield fs.readdir(path.join(__dirname, '..', 'templates', 'post')).catch(util.error)
    yield files.map(function(file){
        file = path.join(__dirname, '..', 'templates', 'post', file)
        switch(false){
            case !(hasExtname('coffee')(file)):
                return co(function*(){
                    const input = yield fs.readFile(file, 'utf8').catch(util.error)
                    const result = coffee.compile(input)
                    const dest = path.join(root, 'nattoppet', path.parse(file).name+'.js')
                    yield fs.writeFile(dest, result).catch(util.error)
                }).catch(util.error)
            case !(hasExtname('less')(file)):
                return co(function*(){
                    const input = yield fs.readFile(file, 'utf8').catch(util.error)
                    const result = (yield less.render(input).catch(util.error)).css
                    const dest = path.join(root, 'nattoppet', path.parse(file).name+'.css')
                    yield fs.writeFile(dest, result).catch(util.error)
                }).catch(util.error)
        }
    })
})

module.exports = co.wrap(function*(root, info){
    yield copyPosts(root, info).catch(util.error)
    yield replaceVar(root, info).catch(util.error)
    yield compileJade(root, info).catch(util.error)
    yield compileLess(root, info).catch(util.error)
    yield compileCoffee(root, info).catch(util.error)
    yield delExtra(root, info).catch(util.error)
    yield compileIndex(root, info).catch(util.error)
    yield compileThemes(root, info).catch(util.error)
    console.info('编译完毕～')
})

const getVar = {
    "Template.dir": x =>
        path.relative(x, path.join(__dirname, '..', 'templates', 'post'))
}

const buildReg = util.memo(function(str){
    const escaped = str.replace(/\./g,'\\.')
    return new RegExp('(nattoppet::'+escaped+')|("-nattoppet::'+escaped+'-")','g')
})

const hasExtname = function(suffixes){
    const extractExt = file => path.extname(file).slice(1).toLowerCase()
    switch(false){
        case !(suffixes instanceof Set):
            return file => suffixes.has(extractExt(file))
        case !(suffixes instanceof Array):
            return file => suffixes.includes(extractExt(file))
        case !(typeof suffixes == 'string'):
            return file => suffixes === extractExt(file)
    }
}

const shouldCompileIn = function(post, root, info){
    const blackList = info.posts[post].info['no-compile']
    const postDir = path.join(root,'posts',post)
    if(blackList && blackList.length){
        return (x) => !blackList.includes(path.relative(postDir, x))
    }else{
        return () => true
    }
}
