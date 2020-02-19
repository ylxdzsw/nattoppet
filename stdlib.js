#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const compiler = require('./compiler')
const stdlib = require('./stdlib')
const coffee = require('coffeescript')
const marked = require('marked')
const katex = require("katex")
const less = require('less')

function move_match(state, reg) {
    reg.lastIndex = state.i
    const token = reg.exec(state.str)
    state.i += token[0].length
    return token
}

const helpers = {
    capture_block() {
        const i = next_match(this.state.str, /^\n/gm, this.state.i).index
        const content = this.state.str.substring(this.state.i, i)
        this.state.i = i
        return content
    },

    capture_until(delimiter, keep=false, eof=false) {
        let i = this.state.str.indexOf(delimiter, this.state.i)
        if (i == -1)
            if (eof)
                i = this.state.str.length
            else
                throw new RangeError("string ends without seeing delimiter " + delimiter)
        const content = this.state.str.substring(this.state.i, i)
        this.state.i = i + (keep ? 0 : delimiter.length)
        return content
    },

    capture_line() {
        return this.capture_until('\n', false, true)
    },

    peek() {
        return this.state.str[this.state.i]
    },

    skip(n=1) {
        this.state.i += n
    }
}

exports = {
    std_dir: __dirname,

    parse(hascontent = false) {
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
        if (file.startsWith('@std')) {
            file = path.join(this.std_dir, file.substring(4))
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
