#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const ymd    = require('./ymd')
const coffee = require('coffeescript')
const less   = require('less')
const marked = require('marked')
const minify = require('html-minifier').minify
// the jstransformer version of katex is unmaintained
const katex = require("katex")

function move_match(state, reg) {
    reg.lastIndex = state.i
    const token = reg.exec(state.str)
    state.i += token[0].length
    return token
}

const helpers = {
    nattoppet_dir: __dirname,

    nattoppet_parse(hascontent = false) {
        const opts = [], args = []
        const parse_option = () => {
            const token = move_match(this.state, /\.([\w\-]+)/g)
            opts.push(token[1])
        }
        const parse_argument = () => {
            const token = move_match(this.state, /\((.*?)\)|{(.*?)}/g)
            args.push(token[1] || token[2])
        }
        const parse_block = () => {
            const token = move_match(this.state, />+/g)
            return this.capture_until('<'.repeat(token[0].length))
        }

        while (true) {
            switch (this.peek()) {
                case '.':
                    parse_option()
                    break
                case '(':
                case '{':
                    parse_argument()
                    break
                case '>':
                    return { opts, args, block: parse_block() }
                case ' ':
                    if (hascontent)
                        return { opts, args, block: this.capture_line() }
                default:
                    return { opts, args }
            }
        }
    },

    read(file, type='utf8') {
        if (file.startsWith('@nattoppet')) {
            file = path.join(this.nattoppet_dir, file.substring(10))
        } else if (!path.isAbsolute(file)) {
            file = path.join(this.base_dir, file)
        }
        return fs.readFileSync(file, type)
    },

    extname(file) {
        return path.extname(file).slice(1)
    },

    basename(file) {
        return path.basename(file)
    },

    render_coffee(str) {
        return coffee.compile(str)
    },

    render_less(str) {
        let x; less.render(str, {}, (err, out) => !err && (x = out))
        if (!x) throw "less failed to compile synchronously"
        return x.css
    },

    render_markdown(str) {
        return marked(str)
    },

    render_katex(str, displayMode = false) {
        return katex.renderToString(str, { displayMode })
    }
}

function render_files(env, ...files) {
    const str = files.map(x=>fs.readFileSync(x, 'utf8')).reduce((x, y) => x + '\n\n' + y)
    return ymd.render(str, env)
}

const rpath = (...x) => path.join(__dirname, ...x)

const render = file => {
    const seg = path.basename(file).split('.')
    const theme = seg[seg.length-2]
    const base_dir = path.dirname(path.resolve(file))
    const env = {base_dir, ...helpers}
    const html = ['koa', 'ppt', 'vue', 'tml'].includes(theme)
        ? render_files(env, rpath(theme, 'before.ymd'), file, rpath(theme, 'after.ymd'), rpath('nattoppet.ymd'))
        : render_files(env, file, rpath('nattoppet.ymd'))
    return minify(html, {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeOptionalTags: true,
        minifyCSS: true,
        minifyJS: true,
    })
}

const file = process.argv[2]

if (process.argv.length != 3 || file == "--help")
    return console.log("Usage: nattoppet file.{koa,ppt,vue,tml}.ymd > file.html")

process.stdout.write(render(file))
