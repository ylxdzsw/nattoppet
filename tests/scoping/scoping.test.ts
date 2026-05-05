import { describe, it, expect } from "bun:test"
import { compile } from "../../compiler.ts"
import stdlib from "../../stdlib.ts"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("Scoping behavior", () => {
    it("supports forward references for ref macros", async () => {
        const input = fs.readFileSync(path.join(__dirname, "forward_refs.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("Before My Title after")
    })

    it("prevents infinite recursion in ref macros by excluding self", async () => {
        const input = fs.readFileSync(path.join(__dirname, "self_ref.ymd"), "utf-8")
        let err: any
        try {
            await compile(input, { ...stdlib, base_dir: __dirname })
        } catch (e) {
            err = e
        }
        expect(err).toBe("definition self not found")
    })

    it("allows fn macros to access ref definitions via dynamic scoping", async () => {
        const input = fs.readFileSync(path.join(__dirname, "dynamic_scope.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("Value: DYNAMIC")
    })

    it("preserves env.remaining across interpret calls in fn macros", async () => {
        const input = fs.readFileSync(path.join(__dirname, "remaining.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("ALPHA-BETA")
    })

    it("supports nested fn macro calls", async () => {
        const input = fs.readFileSync(path.join(__dirname, "nested_calls.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("OUTER(INNER)")
    })

    it("uses the earliest definition when names shadow", async () => {
        const input = fs.readFileSync(path.join(__dirname, "shadowing.ymd"), "utf-8")
        const output = await compile(input, { ...stdlib, base_dir: __dirname })
        expect(output).toContain("FIRST after")
        expect(output).not.toContain("SECOND")
    })
})
