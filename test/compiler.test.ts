import { describe, it, expect } from "bun:test";
import * as compiler from "../compiler.ts";
import stdlib from "../stdlib.ts";

describe("Tokenizer", () => {
  it("should tokenize plain HTML code", async () => {
    const input = "<h1>Hello World</h1>";
    const tokens = await (compiler as any).tokenize(input);
    
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: "code", content: "<h1>Hello World</h1>" });
  });

  it("should tokenize reference definitions", async () => {
    const input = `[title]: My Title

Content here`;
    const tokens = await (compiler as any).tokenize(input);
    
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({ type: "ref", name: "title", content: "My Title" });
    expect(tokens[1]).toEqual({ type: "code", content: "\n\nContent here" });
  });

  it("should tokenize function definitions", async () => {
    const input = `[greet]=
const name = capture_until('\\n')
\`<h1>Hello, \${name}!</h1>\`

[greet]World`;
    const tokens = await (compiler as any).tokenize(input);
    
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({
      type: "fn",
      name: "greet",
      content: "const name = capture_until('\\n')\n\`<h1>Hello, \${name}!</h1>\`"
    });
  });

  it("should tokenize multiple definitions", async () => {
    const input = `[title]: Page Title

[greet]=
\`Hello\`

[ref1]: content1
[ref2]: content2`;
    const tokens = await (compiler as any).tokenize(input);
    
    expect(tokens.length).toBeGreaterThan(3);
    expect(tokens.some((t: any) => t.type === "ref" && t.name === "title")).toBe(true);
    expect(tokens.some((t: any) => t.type === "fn" && t.name === "greet")).toBe(true);
    expect(tokens.some((t: any) => t.type === "ref" && t.name === "ref1")).toBe(true);
    expect(tokens.some((t: any) => t.type === "ref" && t.name === "ref2")).toBe(true);
  });

  it("should handle empty input", async () => {
    const tokens = await (compiler as any).tokenize("");
    expect(tokens).toHaveLength(0);
  });

  it("should handle definitions at end of file without newline", async () => {
    const input = `[title]: Last Line`;
    const tokens = await (compiler as any).tokenize(input);
    
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: "ref", name: "title", content: "Last Line" });
  });
});

describe("Compiler integration", () => {
  it("should compile plain HTML", async () => {
    const input = "<p>Hello World</p>";
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toBe("<p>Hello World</p>");
  });

  it("should resolve simple references", async () => {
    const input = `[title]: Hello

[title]`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output.trim()).toBe("Hello");
  });

  it("should execute simple functions", async () => {
    const input = `[greet]=
const name = capture_until('\\n')
\`Hello, \${name}!\`

[greet]World`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output.trim()).toBe("Hello, World!");
  });

  it("should handle paragraph indentation", async () => {
    const input = `First paragraph.
  
Second paragraph.`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("<p>");
    expect(output).toContain("</p>");
  });

  it("should handle multiple function calls", async () => {
    const input = `[echo]=
const text = capture_until('\\n')
text

[echo]First
[echo]Second
[echo]Third`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output.trim()).toContain("First");
    expect(output.trim()).toContain("Second");
    expect(output.trim()).toContain("Third");
  });

  it("should handle function with options and args", async () => {
    const input = `[test]=
const { opts, args } = std_call()
\`opts=\${opts.join(',')}, args=\${args.join(',')}\`

[test].opt1.opt2(arg1)(arg2)`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("opt1");
    expect(output).toContain("opt2");
    expect(output).toContain("arg1");
    expect(output).toContain("arg2");
  });

  it("should handle block content with > and <", async () => {
    const input = `[box]=
const { block } = std_call(true)
\`<div>\${interpret(block)}</div>\`

[box]>
Content inside
<
`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("<div>");
    expect(output).toContain("</div>");
    expect(output).toContain("Content inside");
  });
});

describe("Error handling", () => {
  it("should throw on undefined reference", async () => {
    const input = `[undefined_ref]`;
    
    await expect(compiler.compile(input, { ...stdlib, base_dir: "." })).rejects.toThrow();
  });

  it("should handle empty definitions", async () => {
    const input = `[empty]:

[empty]`;
    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    
    expect(output.trim()).toBe("");
  });
});

describe("Scoping (define-after-calling)", () => {
  it("should resolve references defined after usage", async () => {
    // The definition appears AFTER it's used in the code
    const input = `Content: [greeting]

[greeting]: Hello World`;

    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("Hello World");
  });

  it("should resolve functions defined after usage", async () => {
    // The function definition appears AFTER it's called
    const input = `Result: [calc]5

[calc]=
const n = capture_until('\n')
` + '`' + `Calculated: ${n}` + '`';

    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("Calculated: 5");
  });

  it("should support forward references in definitions", async () => {
    // A reference can use another reference defined later
    const input = `[combined]: [first] [second]

First: [combined]

[first]: Hello
[second]: World`;

    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("Hello");
    expect(output).toContain("World");
  });

  it("should allow functions to call functions defined later", async () => {
    // Functions can call other functions that are defined later in the document
    const input = `[caller]=
[callee]

[caller]

[callee]=
` + '`' + `Called!` + '`';

    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("Called!");
  });

  it("should handle definitions in any order (koa-style)", async () => {
    // Template-style usage where definitions come last
    const input = `Title: [title]

Section: [section]Intro

[title]: My Document
[section]=
const name = capture_until('\n')
` + '`' + `<section>${name}</section>` + '`';

    const output = await compiler.compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("My Document");
    expect(output).toContain("<section>Intro</section>");
  });
});
