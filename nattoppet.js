#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const transformer = require('jstransformer')

const pug    = transformer(require('jstransformer-pug'))
const coffee = transformer(require('jstransformer-coffee-script'))
const scss   = transformer(require('jstransformer-scss'))
const marked = transformer(require('jstransformer-marked'))
const minify = transformer(require('jstransformer-html-minifier'))
const uglify = transformer(require('jstransformer-uglify-js'))

const vars = {
    assetpath: path.join(__dirname, 'assets').replace(/C:\\|\\/g, '/') // workaround for pug on windows
}

const compile = file => {
    const suffix = path.extname(file).slice(1).toLowerCase()
    const _require = x => compile(x.startsWith('/') ? x : path.join(path.dirname(file), x))
    const content = () => {
        let x = fs.readFileSync(file, 'utf8')
        const list = x.match(/@nattoppet[:\.][a-zA-Z0-9\.\-_]+/g) || []
        for (const token of list) {
            const c = token.startsWith("@nattoppet:") ? _require(token.slice(11)) :
                      token.startsWith("@nattoppet.") ? vars[token.slice(11)] : token
            x = x.split(token).join(c) // replace all without buiding a proper escaped RegExp
        }
        return x
    }

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

const file = process.argv[2]
const opts = process.argv[3]

if (process.argv.length < 3 || file == "--help") {
    return console.log(`
nattoppet: A tiny HTML bundler.

  nattoppet file [opt.json] > file.html

Compile file with a special function "require" which you can use inside the jade file. Required file will be \
bundle into the compiled HTML file directly, with coffee/sass compiled and minified and images base64 encoded.

Special replacement are performed for "@nattoppet:[file]" and "@nattoppet.[var]". The former will be replaced \
by compiled string of that file, and the latter will be replaced by the content provided as in [opt.json].
`)}

if (opts) {
    Object.assign(vars, JSON.parse(fs.readFileSync(file, 'utf8')))
}

process.stdout.write(compile(file))
