import * as path from "https://deno.land/std@0.181.0/path/mod.ts"
import * as base64 from "https://deno.land/std@0.181.0/encoding/base64.ts"
import * as zlib from 'node:zlib'

import * as marked from "npm:marked@^4.0.10"
import coffee from "https://cdn.skypack.dev/coffeescript@^2.6.1"
import katex from "npm:katex@^0.16.2"
import less from "npm:less@^4.1.3"

function compress_sync(data: ArrayBuffer) {
    // https://github.com/denoland/deno/blob/c08319262afeca47d1b9f3dbfa3254e692a48a2d/ext/web/compression.rs#L56
    // https://github.com/denoland/deno/blob/c08319262afeca47d1b9f3dbfa3254e692a48a2d/ext/web/14_compression.js
    // const ops = Deno[Deno.internal].core.ops
    // const rid = ops.op_compression_new("deflate-raw", false)
    // const output = ops.op_compression_write(rid, data)
    // const output2 = ops.op_compression_finish(rid)
    // const output3 = new Uint8Array(output.length + output2.length)
    // output3.set(output)
    // output3.set(output2, output.length)
    // return output3

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
        switch (encoding) {
            case "utf8":
            case "utf-8":
                return Deno.readTextFileSync(this.rpath(file))
            case "base64":
                return base64.encode(Deno.readFileSync(this.rpath(file)))
            case "compressed-base64":
                return base64.encode(compress_sync(Deno.readFileSync(this.rpath(file))))
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
