import { describe, it, expect } from "bun:test"
import { compile } from "../../compiler.ts"
import stdlib from "../../stdlib.ts"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, "fixtures")

describe("[cn] macro", () => {
    it("removes newlines between CJK characters", async () => {
        const input = `[cn]>>
中
文
<<

[mixin] common.ymd
`
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("中文")
        expect(output).not.toContain("中\n文")
    })

    it("removes newlines between CJK and ASCII non-whitespace", async () => {
        const input = `[cn]>>
中
a
<<

[mixin] common.ymd
`
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("中a")
        expect(output).not.toContain("中\na")
    })

    it("preserves newlines between CJK and ASCII whitespace", async () => {
        const input = `[cn]>>
中
 a
<<

[mixin] common.ymd
`
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("中\n a")
    })

    it("preserves multiple consecutive newlines between CJK characters", async () => {
        const input = `[cn]>>
中

文
<<

[mixin] common.ymd
`
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("中\n\n文")
    })

    it("removes each single newline in multi-line CJK text", async () => {
        const input = `[cn]>>
中
文
字
<<

[mixin] common.ymd
`
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("中文字")
    })

    it("compiles fixture with block mode for multi-line CJK text", async () => {
        const fixturePath = path.join(fixturesDir, "cjk_block.ymd")
        const input = fs.readFileSync(fixturePath, "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("这是一个测试")
        expect(output).toContain("多行文本")
    })
})
