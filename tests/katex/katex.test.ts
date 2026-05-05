import { describe, it, expect } from "bun:test"
import { compile } from "../../compiler.ts"
import stdlib from "../../stdlib.ts"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("KaTeX rendering", () => {
    it("renders inline math with [$]", async () => {
        const input = fs.readFileSync(path.join(__dirname, "inline_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('E')
        expect(output).toContain('mc')
    })

    it("renders display math with [$$]", async () => {
        const input = fs.readFileSync(path.join(__dirname, "display_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('class="katex-display"')
    })

    it("includes inlined KaTeX CSS when using the katex mixin", async () => {
        const input = fs.readFileSync(path.join(__dirname, "katex_css.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('@font-face')
        expect(output).toContain('font-family:KaTeX_Main')
        expect(output).toContain('data:font/woff2;base64,')
        expect(output).toContain('.katex')
        expect(output).toContain('Some math content')
    })
})
