import * as path from "https://deno.land/std@0.126.0/path/mod.ts"
import minifier from "https://esm.sh/html-minifier-terser@^6.1.0"

import stdlib from "./stdlib.ts"
import * as compiler from "./compiler.ts"

const compiled = await (async () => {
    const file = Deno.args[0]
    if (file) {
        const dir = path.dirname(path.resolve(file))
        const code = Deno.readTextFileSync(file)
        return await compiler.compile(code, { ...stdlib, base_dir: dir })
    } else {
        const dir = Deno.cwd()
        const code = await new Response(Deno.stdin.readable).text()
        return await compiler.compile(code, { ...stdlib, base_dir: dir })
    }
})()

const minified = Deno.args.includes('--dev') ? compiled : await minifier.minify(compiled, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: true,
})

const output_stream = new TextEncoderStream()
output_stream.readable.pipeTo(Deno.stdout.writable)
await output_stream.writable.getWriter().write(minified)
