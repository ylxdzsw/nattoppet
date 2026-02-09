import { describe, it, expect } from "bun:test";
import { compile } from "../compiler.ts";
import stdlib from "../stdlib.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

describe("Basic Compilation", () => {
  it("should compile simple HTML", async () => {
    const input = `<h1>Hello</h1>`;
    const output = await compile(input, { ...stdlib, base_dir: __dirname });
    expect(output).toContain("<h1>Hello</h1>");
  });

  it("should resolve forward references", async () => {
    const input = `Content: [title]

[title]: My Title`;
    const output = await compile(input, { ...stdlib, base_dir: __dirname });
    expect(output).toContain("Content: My Title");
  });

  it("should compile vue template", async () => {
    const input = `[mixin] vue

[title]: Test

[h2]Welcome
Hello world.`;
    const output = await compile(input, { ...stdlib, base_dir: path.join(__dirname, "..") });
    expect(output).toContain("Test");
    expect(output).toContain("Welcome");
  });
});
