import * as path from "node:path"
import * as fs from "node:fs"
import * as zlib from "node:zlib"

import { marked } from "marked"
import coffee from "coffeescript"
import katex from "katex"
import less from "less"

function compress_sync(data: ArrayBuffer) {
    // Keep using zlib.deflateRawSync for browser compatibility
    // Browser uses DecompressionStream("deflate-raw") which expects raw deflate
    return zlib.deflateRawSync(new Uint8Array(data), {
        flush: zlib.constants.Z_FINISH,
        level: zlib.constants.Z_BEST_COMPRESSION
    })
}

export default {
    skip(n: number) {
        this.remaining = this.remaining.substring(n)
    },

    capture_until(delimiter: string) {
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
        const opts: string[] = [], args: string[] = []
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
            const m = this.remaining.match(/^(>+)\n?/)
            this.skip(m[0].length)
            return this.capture_until('<'.repeat(m[1].length))
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
                        return { opts, args, block: this.capture_until('\n').slice(1) }
                default:
                    return { opts, args }
            }
        }
    },

    rpath(file: string) {
        if (!path.isAbsolute(file))
            return path.join(this.base_dir, file)
        return file
    },

    read(file: string, encoding = "utf-8") {
        const filePath = this.rpath(file)
        switch (encoding) {
            case "utf8":
            case "utf-8":
                return fs.readFileSync(filePath, 'utf-8')
            case "base64":
                return Buffer.from(fs.readFileSync(filePath)).toString('base64')
            case "compressed-base64":
                return Buffer.from(compress_sync(fs.readFileSync(filePath))).toString('base64')
            default:
                throw "unknown encoding: " + encoding
        }
    },

    extname(file: string) {
        return path.extname(file).slice(1)
    },

    basename(file: string) {
        return path.basename(file)
    },

    render_coffee(str: string, options: any) {
        return coffee.compile(str, options)
    },

    render_less(str: string) {
        let x: any; less.render(str, {}, (err: any, out: any) => !err && (x = out))
        if (!x) throw "less failed to compile synchronously"
        return x.css
    },

    render_markdown(str: string) {
        return marked.parse(str)
    },

    render_katex(str: string, displayMode = false) {
        return katex.renderToString(str, { displayMode, output: 'html' })
    }
} as any
