import { describe, it, expect } from "bun:test";
import { compile } from "../compiler.ts";
import stdlib from "../stdlib.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

// Helper to read fixture file
const readFixture = (name: string): string => {
  return fs.readFileSync(path.join(fixturesDir, name), "utf-8");
};

describe("Integration - Basic Compilation", () => {
  it("should compile simple.ymd fixture", async () => {
    const input = readFixture("simple.ymd");
    const output = await compile(input, { ...stdlib, base_dir: fixturesDir });
    
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("My Simple Page");
    expect(output).toContain("<h1>");
    expect(output).toContain("Welcome");
  });
});

describe("Integration - Template System", () => {
  it("should compile koa template pattern", async () => {
    const input = `[mixin] koa

[title]: Test Post

[section]Introduction
This is the intro.

[section]Methods
These are methods.

[section]Conclusion
Final thoughts.`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Test Post");
    expect(output).toContain("Introduction");
    expect(output).toContain("Methods");
    expect(output).toContain("Conclusion");
  });

  it("should compile form template pattern", async () => {
    const input = `[mixin] form

[title]: Calculator

[h3]Inputs
[text].input1 First Number
[number].input2 Second Number

[h3]Output`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Calculator");
    expect(output).toContain("<button>");
    expect(output).toContain("<input");
  });

  it("should compile ppt template pattern", async () => {
    const input = `[mixin] ppt

[title]: Presentation

[section].banner
Title Slide

[section]
Content Slide

[h3]Bullet Point`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Presentation");
    expect(output).toContain("scen");
  });

  it("should compile vue template pattern", async () => {
    const input = `[mixin] vue

[title]: Documentation

[h2]Getting Started
Welcome to the docs.

[h3]Installation
Steps to install.`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Documentation");
    expect(output).toContain("<h2>");
    expect(output).toContain("<h3>");
  });

  it("should compile tml template pattern", async () => {
    const input = `[mixin] tml

[title]: Timeline

[article]Event 1
Description of first event.

[article]Event 2
Description of second event.`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Timeline");
    expect(output).toContain("<article>");
  });

  it("should compile katex template pattern", async () => {
    const input = `[mixin] katex

[title]: Math Paper

The equation [$]E = mc^2[$] is famous.

[$$]>
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
<`;

    const output = await compile(input, { 
      ...stdlib, 
      base_dir: path.join(__dirname, "..") 
    });
    
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Math Paper");
    expect(output).toContain("math");
  });
});

describe("Integration - Common Macros", () => {
  const baseEnv = { ...stdlib, base_dir: fixturesDir };

  it("should handle h2, h3, h4 macros", async () => {
    const input = `[mixin] common.ymd

[h2]Section Title
[h3]Subsection
[h4]Sub-subsection`;

    const output = await compile(input, baseEnv);
    
    expect(output).toContain("<h2>");
    expect(output).toContain("</h2>");
    expect(output).toContain("<h3>");
    expect(output).toContain("</h3>");
    expect(output).toContain("<h4>");
    expect(output).toContain("</h4>");
  });

  it("should handle quote macro", async () => {
    const input = `[mixin] common.ymd

[quote]>
This is a quote.
<`;

    const output = await compile(input, baseEnv);
    
    expect(output).toContain("<blockquote>");
    expect(output).toContain("This is a quote.");
    expect(output).toContain("</blockquote>");
  });

  it("should handle link macro", async () => {
    const input = `[mixin] common.ymd

[link](https://example.com, Click here)`;

    const output = await compile(input, baseEnv);
    
    expect(output).toContain('<a');
    expect(output).toContain('href="https://example.com"');
    expect(output).toContain("Click here");
    expect(output).toContain("</a>");
  });

  it("should handle code macro", async () => {
    const input = `[mixin] common.ymd

[code](javascript)>
const x = 1;
<`;

    const output = await compile(input, baseEnv);
    
    expect(output).toContain("<pre>");
    expect(output).toContain("<code");
    expect(output).toContain("language-javascript");
    expect(output).toContain("const x = 1");
  });

  it("should handle comment macro", async () => {
    const input = `[mixin] common.ymd

Visible content
[#] This is a comment
More visible content`;

    const output = await compile(input, baseEnv);
    
    expect(output).toContain("Visible content");
    expect(output).toContain("More visible content");
    expect(output).not.toContain("This is a comment");
  });
});

describe("Integration - Complex Scenarios", () => {
  it("should handle nested function calls", async () => {
    const input = `[outer]=
const inner = interpret('[inner]')
\`Outer: \${inner}\`

[inner]=
\`Inner Content\`

[outer]`;

    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("Outer:");
    expect(output).toContain("Inner Content");
  });

  it("should handle custom macro definitions", async () => {
    const input = `[card]=
const { args: [title], block } = std_call(true)
\`<div class="card"><h3>\${title}</h3><p>\${interpret(block)}</p></div>\`

[card](My Card)>
This is the card content.
<

[card](Another Card)>
More content here.
<`;

    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("card");
    expect(output).toContain("My Card");
    expect(output).toContain("Another Card");
  });

  it("should handle stateful macros", async () => {
    const input = `[counter]=
this.count = (this.count || 0) + 1
\`Count: \${this.count}\`

[counter]
[counter]
[counter]`;

    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("Count: 1");
    expect(output).toContain("Count: 2");
    expect(output).toContain("Count: 3");
  });
});

describe("Integration - Edge Cases", () => {
  it("should handle empty input", async () => {
    const output = await compile("", { ...stdlib, base_dir: "." });
    expect(output).toBe("");
  });

  it("should handle only whitespace", async () => {
    const output = await compile("   \n\n   ", { ...stdlib, base_dir: "." });
    expect(output.trim()).toBe("");
  });

  it("should handle special characters in content", async () => {
    const input = `[test]: <>&"'

[test]`;
    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("<");
    expect(output).toContain(">");
    expect(output).toContain("&");
    expect(output).toContain('"');
    expect(output).toContain("'");
  });

  it("should handle unicode content", async () => {
    const input = `[title]: 你好世界 🌍

[title]`;
    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain("你好世界");
    expect(output).toContain("🌍");
  });

  it("should handle very long lines", async () => {
    const longContent = "a".repeat(10000);
    const input = `[long]: ${longContent}

[long]`;
    const output = await compile(input, { ...stdlib, base_dir: "." });
    
    expect(output).toContain(longContent);
  });
});
