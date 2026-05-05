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

    it("renders unicode and symbols in inline math", async () => {
        const input = fs.readFileSync(path.join(__dirname, "unicode_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        // Greek letters render as raw unicode text in spans
        expect(output).toContain('α')
        expect(output).toContain('β')
        expect(output).toContain('γ')
        // sum and infinity symbols
        expect(output).toContain('∑')
        expect(output).toContain('∞')
        // Blackboard bold uses mathbb class with plain letters
        expect(output).toContain('class="mord mathbb"')
    })

    it("renders aligned environment in display math", async () => {
        const input = fs.readFileSync(path.join(__dirname, "aligned_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('class="katex-display"')
        // aligned environment renders as mtable with alignment classes
        expect(output).toContain('class="mtable"')
        expect(output).toContain('class="col-align-r"')
        expect(output).toContain('class="col-align-l"')
    })

    it("renders matrix environment in display math", async () => {
        const input = fs.readFileSync(path.join(__dirname, "matrix_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('class="katex-display"')
        // pmatrix renders as mtable
        expect(output).toContain('class="mtable"')
    })

    it("renders cases environment in display math", async () => {
        const input = fs.readFileSync(path.join(__dirname, "cases_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('class="katex-display"')
        // cases environment renders as mtable with array cells
        expect(output).toContain('class="mtable"')
        expect(output).toContain('class="arraycolsep"')
    })

    it("renders nested fractions in display math", async () => {
        const input = fs.readFileSync(path.join(__dirname, "fraction_math.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain('class="katex"')
        expect(output).toContain('class="katex-display"')
        // fraction bars (frac-line classes)
        expect(output).toContain('frac-line')
    })
})
