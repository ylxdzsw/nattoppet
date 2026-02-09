import * as path from "node:path"
import * as fs from "node:fs"
import minifier from "html-minifier-terser"

import stdlib from "./stdlib.ts"
import * as compiler from "./compiler.ts"

const compiled = await (async () => {
    const file = process.argv[2]
    if (file) {
        const dir = path.dirname(path.resolve(file))
        const code = fs.readFileSync(file, 'utf-8')
        return await compiler.compile(code, { ...stdlib, base_dir: dir })
    } else {
        const dir = process.cwd()
        const chunks: Uint8Array[] = []
        for await (const chunk of process.stdin) {
            chunks.push(chunk)
        }
        const code = Buffer.concat(chunks).toString('utf-8')
        return await compiler.compile(code, { ...stdlib, base_dir: dir })
    }
})()

const minified = process.argv.includes('--dev') ? compiled : await minifier.minify(compiled, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: true,
})

process.stdout.write(minified)
