#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const transformer = require('jstransformer')

const pug    = transformer(require('jstransformer-pug'))
const coffee = transformer(require('jstransformer-coffee-script'))
const scss   = transformer(require('jstransformer-scss'))
const marked = transformer(require('jstransformer-marked'))
const minify = transformer(require('jstransformer-html-minifier'))
const uglify = transformer(require('jstransformer-uglify-js'))

const compile = file => {
    const suffix = path.extname(file).slice(1).toLowerCase()
    const _require = y => compile(y.startsWith('/') ? y : path.join(path.dirname(file), y))
    const assetpath = path.join(__dirname, 'assets').replace(/(C:\\)|\\/g, '/') // workaround for pug on windows
    const content = () => fs.readFileSync(file, 'utf8').replace(/@nattoppet/g, assetpath)

    switch (suffix) {
        case 'pug':
        case 'jade':
            const x = pug.render(content(), {filename: file, basedir: '/'}, {require: _require}).body
            return minify.render(x, { removeAttributeQuotes:true, removeComments:true }).body
        case 'scss':
            return scss.render(content(), {outputStyle: 'compressed'}).body
        case 'coffee':
            return uglify.render(coffee.render(content()).body).body
        case 'md':
            return marked.render(content()).body
        case 'png':
        case 'jpg':
        case 'gif':
        case 'jpeg':
            return `data:image/${suffix};base64,` + fs.readFileSync(file, 'base64')
        default:
            return content()
    }
}

const opt = process.argv[2]

if (process.argv.length != 3 || opt == "--help") {
    return console.log(`
nattoppet: A tiny HTML bundler.

  nattoppet file > file.html

Compile file with a special function "require" which you can use inside the jade file. Required file will be \
bundle into the compiled HTML file directly, with coffee/sass compiled and minified and images base64 encoded.
`)}

process.stdout.write(compile(opt))
