#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const transformer = require('jstransformer')

const pug    = transformer(require('jstransformer-pug'))
const coffee = transformer(require('jstransformer-coffee-script'))
const less   = transformer(require('jstransformer-less'))
const sass   = transformer(require('jstransformer-sass'))
const marked = transformer(require('jstransformer-marked'))
const minify = transformer(require('jstransformer-html-minifier'))
const uglify = transformer(require('jstransformer-uglify-js'))

const compile = file => {
    const suffix = path.extname(file).slice(1).toLowerCase()
    const _require = y => compile(path.join(path.dirname(file), y))

    switch (suffix) {
        case 'pug':
        case 'jade':
            const x = pug.renderFile(file, {filename: file}, {require: _require}).body
            return minify.render(x, { removeAttributeQuotes:true, removeComments:true }).body
        case 'sass':
        case 'scss':
            return sass.renderFile(file, {outputStyle: 'compressed'}).body
        case 'less':
            return less.renderFile(file, {compress: true}).body
        case 'coffee':
            return uglify.render(coffee.renderFile(file).body).body
        case 'markdown':
        case 'md':
            return marked.renderFile(file).body
        case 'png':
        case 'jpg':
        case 'gif':
        case 'jpeg':
            return `data:image/${suffix};base64,` + fs.readFileSync(file, 'base64')
        default:
            return fs.readFileSync(file, 'utf8')
    }
}

const posts = []

const walk = dir => {
    const list = fs.readdirSync(dir)
    for (let item of list) {
        const stat = fs.statSync(path.join(dir, item))
        if (stat.isFile()) {
            if (item == "main.jade" || item == "main.html") {
                dir = dir.split(path.sep)
                const name = dir[dir.length-1]
                posts.push(name)
                fs.writeFileSync(name + '.html', compile(path.join(...dir, item)))
                break
            }
        } else if (stat.isDirectory()) {
            walk(path.join(dir, item))
        }
    }
}

const opt = process.argv[2]

if (process.argv.length != 3 || opt == "--help") {
    return console.log(`
nattoppet: A tiny HTML bundler and static blog generator.

  nattoppet file

Compile file with a special function "require" which you can use inside the jade file. Required file will be \
bundle into the compiled HTML file directly, with coffee/sass compiled and minified and images base64 encoded.

  nattoppet folder

Find all "main.jade" insides folder and sub-folders and compile all them. The output HTML's names are the direct \
folder names. If there being a "index.jade" under the folder, it will be compiled with a variable "posts" witch \
contains all compiled file names.

Outputs will be placed into current work directory
`)}

if (!fs.existsSync(opt)) {
    return console.error("file or folder not exists")
}

const stat = fs.statSync(opt)

if (stat.isFile()) {
    const html = compile(opt)
    const dest = path.join(path.dirname(opt), path.parse(opt).name+'.html')
    fs.writeFileSync(dest, html)
    console.info('bundle finished')
} else if (stat.isDirectory()) {
    walk(opt)
    let index = path.join(opt, "index.jade")
    let msg = ''
    if (fs.existsSync(index)) {
        index = pug.renderFile(index, {filename: index}, {posts: posts}).body
        index = minify.render(index, { removeAttributeQuotes:true, removeComments:true }).body
        fs.writeFileSync("index.html", index)
        msg = "and an index"
    }
    console.info(`build finished, ${posts.length} bundles ${msg} generated`)
} else {
    console.error(`$opt should be a text file or a folder`)
}

