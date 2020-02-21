#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const coffee = require('coffeescript')
const marked = require('marked')
const katex = require("katex")
const less = require('less')

module.exports = {
    stdlib_dir: __dirname,

    skip(n) {
        this.remaining = this.remaining.substring(n)
    },

    capture_until(delimiter) {
        const p = this.remaining.indexOf(delimiter)
        if (p < 0) {
            const result = this.remaining
            this.remaining = ""
            return result
        }
        const result = this.remaining.substring(0, p)
        this.remaining = this.remaining.substring(p + delimiter.length)
        return result
    },

    std_call(hascontent = false) {
        const opts = [], args = []
        const parse_option = () => {
            const m = this.remaining.match(/^\.([\w\-]+)/)
            this.skip(m[0].length)
            opts.push(m[1])
        }
        const parse_argument = () => {
            const m = this.remaining.match(/^\((.*?)\)|{(.*?)}/)
            this.skip(m[0].length)
            args.push(m[1] || m[2])
        }
        const parse_block = () => {
            const m = this.remaining.match(/^>+/)
            this.skip(m[0].length)
            return this.capture_until('<'.repeat(m[0].length))
        }

        while (true) {
            switch (this.remaining[0]) {
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
                        return { opts, args, block: this.capture_until('\n') }
                default:
                    return { opts, args }
            }
        }
    },

    rpath(file) {
        if (file.startsWith('@std')) {
            return path.join(this.stdlib_dir, file.substring(4))
        } else if (!path.isAbsolute(file)) {
            return path.join(this.base_dir, file)
        }
        return file
    },

    read(file, encoding='utf8') {
        return fs.readFileSync(this.rpath(file), encoding)
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

    render_katex(str, displayMode=false) {
        return katex.renderToString(str, { displayMode })
    }
}
