import { describe, it, expect } from "bun:test"
import { compile } from "../../compiler.ts"
import stdlib from "../../stdlib.ts"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("Paragraph generation", () => {
    it("opens paragraph on two-space indent", async () => {
        const input = "  hello world"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>hello world</p>")
    })

    it("separates paragraphs by blank lines", async () => {
        const input = "  first paragraph\n\n  second paragraph"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>first paragraph</p><p>second paragraph</p>")
    })

    it("resolves macros inside paragraphs", async () => {
        const input = "  hello [name]\n\n[name]: world"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>hello world</p>")
    })

    it("passes through non-indented text without p tags", async () => {
        const input = "hello world"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("hello world")
    })

    it("handles mixed indented and non-indented blocks", async () => {
        const input = "intro\n  indented paragraph\noutro"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("intro\n<p>indented paragraph\noutro</p>")
    })

    it("handles trailing and leading whitespace around paragraphs", async () => {
        const input = "  hello world  \n\n  foo bar"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>hello world  </p><p>foo bar</p>")
    })

    it("nests paragraphs when every line is indented", async () => {
        const input = "  line1\n  line2"
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>line1\n<p>line2</p></p>")
    })

    it("compiles basic paragraph fixture", async () => {
        const input = fs.readFileSync(path.join(__dirname, "basic.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>First paragraph.</p><p>Second paragraph.\n</p>")
    })

    it("compiles paragraph fixture with macros", async () => {
        const input = fs.readFileSync(path.join(__dirname, "with_macros.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("<p>Hello Alice, welcome to Wonderland.</p>")
    })

    it("compiles mixed paragraph fixture", async () => {
        const input = fs.readFileSync(path.join(__dirname, "mixed.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toBe("Intro text without indent.\n\n<p>Indented paragraph.</p>Outro text.\n")
    })
})
