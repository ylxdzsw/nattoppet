import { describe, it, expect } from "bun:test"
import { compile } from "../../compiler.ts"
import stdlib from "../../stdlib.ts"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("WASM require", () => {
    it("should compile a ymd that requires a wasm file", async () => {
        const input = fs.readFileSync(path.join(__dirname, "test.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })

        expect(output).toContain("WebAssembly.instantiateStreaming")
        expect(output).toContain("window.wasm_ready")
        expect(output).toContain('DecompressionStream("deflate-raw")')
        expect(output).toContain("data:application/octet-stream;base64,")
        expect(output).toContain("window.test = x.instance.exports")
    })
})
