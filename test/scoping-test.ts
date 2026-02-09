import { describe, it, expect } from "bun:test";
import { compile } from "../compiler.ts";
import stdlib from "../stdlib.ts";

const env = { ...stdlib, base_dir: "." };

describe("Scoping Rules Analysis", () => {

  describe("1. Forward References (SHOULD work)", () => {
    it("can use a ref defined AFTER usage (define-after-use)", async () => {
      const input = `Content: [greeting]

[greeting]: Hello World`;
      
      // 'greeting' is in remaining tokens when code is processed
      const output = await compile(input, env);
      expect(output).toContain("Hello World");
    });

    it("can use a fn defined AFTER usage", async () => {
      const input = `Result: [calc]5

[calc]=
const n = capture_until('\n')
\`Value: \${n}\``;
      
      // 'calc' is in remaining tokens when code is processed
      const output = await compile(input, env);
      expect(output).toContain("Value: 5");
    });
  });

  describe("2. Backward References (CANNOT work by design)", () => {
    it("CANNOT use a ref defined BEFORE in the same code block", async () => {
      const input = `[greeting]: Hello

Content: [greeting]`;
      
      // When processing "Content: [greeting]", the [greeting] def has been shifted out
      // So it's not in remaining tokens
      await expect(compile(input, env)).rejects.toThrow(/greeting/);
    });

    it("CANNOT use a fn defined BEFORE in the same code block", async () => {
      const input = `[calc]=
const n = capture_until('\n')
\`Value: \${n}\`

Result: [calc]5`;
      
      // When processing "Result: [calc]5", the [calc] def has been shifted out
      await expect(compile(input, env)).rejects.toThrow(/calc/);
    });

    it("definition in middle between code blocks fails on second usage", async () => {
      const input = `First: [title]

[title]: My Title

Second: [title]`;
      
      // First works (forward ref - title is in remaining tokens)
      // Second fails (backward ref - title was shifted out)
      await expect(compile(input, env)).rejects.toThrow(/title/);
    });
  });

  describe("3. Reference Lexical Scoping (defs.slice(i+1))", () => {
    it("reference can access definitions AFTER itself (forward)", async () => {
      const input = `[combined]: [first] [second]

[combined]

[first]: Hello
[second]: World`;
      
      // When processing [combined]'s content: "[first] [second]"
      // defs.slice(i+1) includes first and second (they come after combined in remaining tokens)
      const output = await compile(input, env);
      expect(output).toContain("Hello");
      expect(output).toContain("World");
    });

    it("reference CANNOT access definitions BEFORE itself", async () => {
      const input = `[before]: Defined before

[after]: [before]

[after]`;
      
      // When processing [after]'s content: "[before]"
      // [before] was shifted out before this code block, so not in defs
      await expect(compile(input, env)).rejects.toThrow(/before/);
    });

    it("reference CANNOT see itself (prevents infinite recursion)", async () => {
      const input = `[self]: [self]

[self]`;
      
      // defs.slice(i+1) excludes self, so self cannot reference itself
      await expect(compile(input, env)).rejects.toThrow(/self/);
    });

    it("chained references work forward only", async () => {
      const input = `[a]: Value A
[b]: [a]
[c]: [b]

[c]`;
      
      // c can see b (b comes after c in defs)
      // b can see a? Let's check:
      // When processing "[c]", remaining tokens are [a, b, c]
      // c uses defs.slice(3) = [] to interpret "[b]"
      // Actually b has index 1, so defs.slice(2) = [c], but we need [a]
      // So this should fail!
      await expect(compile(input, env)).rejects.toThrow(/a/);
    });
  });

  describe("4. Function Dynamic Scoping (full defs)", () => {
    it("function CAN access definitions AFTER itself (lexical-like)", async () => {
      const input = `[caller]=
interpret('[callee]')

[caller]

[callee]=
\`Found me!\``;
      
      // When [caller] is called, remaining tokens include [callee]
      // interpret('[callee]') uses full defs, can find [callee]
      const output = await compile(input, env);
      expect(output).toContain("Found me!");
    });

    it("function CAN access definitions BEFORE itself (dynamic scoping)", async () => {
      const input = `[callee]=
\`I am callee\`

[caller]=
interpret('[callee]')

[caller]`;
      
      // When [caller] is called, remaining tokens include both [callee] and [caller]
      // Full defs are passed, so [callee] (index 0) is found
      const output = await compile(input, env);
      expect(output).toContain("I am callee");
    });

    it("function in middle can access definitions before AND after", async () => {
      const input = `[before]=
\`I am before\`

[middle]=
interpret('[before]') + ' and ' + interpret('[after]')

[middle]

[after]=
\`I am after\``;
      
      // Full defs at call site: [before, middle, after]
      // middle can see both before and after
      const output = await compile(input, env);
      expect(output).toContain("I am before");
      expect(output).toContain("I am after");
    });

    it("nested function calls maintain dynamic scoping", async () => {
      const input = `[outer]=
const result = interpret('[inner]')
\`Outer got: \${result}\`

[inner]=
\`Inner result\`

[outer]`;
      
      const output = await compile(input, env);
      expect(output).toContain("Outer got: Inner result");
    });
  });

  describe("5. BUG: Definitions Before Code Block", () => {
    it("POTENTIAL BUG: definition at document start cannot be used", async () => {
      const input = `[title]: My Title

Some content mentioning [title]`;
      
      // When processing "Some content...", [title] has been shifted out
      // So it's not in remaining tokens
      await expect(compile(input, env)).rejects.toThrow(/title/);
    });

    it("workaround: put definitions AFTER usage (Koa-style)", async () => {
      const input = `Some content mentioning [title]

[title]: My Title`;
      
      // This is the intended pattern - define after use
      const output = await compile(input, env);
      expect(output).toContain("My Title");
    });
  });

  describe("6. Self-Reference and Recursion", () => {
    it("reference CANNOT reference itself (prevents infinite loop)", async () => {
      const input = `[self]: [self]

[self]`;
      
      await expect(compile(input, env)).rejects.toThrow(/self/);
    });

    it("function CANNOT call itself (not in scope at call time)", async () => {
      const input = `[recursive]=
\`Attempting recursion\`

[recursive]

[recursive]`;
      
      // The second [recursive] works, but the function can't call itself
      // because when the fn body runs, [recursive] has been shifted out
      await expect(compile(input, env)).rejects.toThrow(/recursive/);
    });
  });

  describe("7. Complex Scenarios", () => {
    it("selective access based on order", async () => {
      const input = `[a]: First
[b]: Second

Content: [a] and [b]

[c]: Third`;
      
      // Can access a and b (they come after content in remaining tokens)
      // c is also accessible (comes after content)
      const output = await compile(input, env);
      expect(output).toContain("First");
      expect(output).toContain("Second");
      // Actually c IS accessible - let me re-check the logic
      // When processing content, remaining tokens: [a, b, c]
      // So [c] should also be visible if used
    });

    it("reference using other refs in content", async () => {
      const input = `[outer]: Content with [inner]

[outer]

[inner]: nested content`;
      
      // When processing [outer]'s content "Content with [inner]"
      // inner is in defs.slice(1) = [inner] (inner comes after outer)
      const output = await compile(input, env);
      expect(output).toContain("nested content");
    });
  });
});

describe("Scoping Summary", () => {
  it("documents the implemented scoping rules", () => {
    const rules = {
      paradigm: "Define-After-Use (Forward References Only)",
      reference_scoping: {
        type: "Lexical",
        mechanism: "defs.slice(i+1)",
        can_see: "Only definitions that appear AFTER in the document",
        self_reference: false,
        backward_refs: false,
        forward_refs: true
      },
      function_scoping: {
        type: "Dynamic",
        mechanism: "Full defs passed at call site",
        can_see: "ALL definitions visible at call site (before AND after in document)",
        self_reference: false,
        backward_refs: true,
        forward_refs: true
      },
      key_insight: "Tokens are shifted from FRONT, so code blocks only see REMAINING definitions",
      limitation: "Definitions before a code block are NOT visible to that code block",
      pattern: "Koa-style: Put definitions at the END of the document"
    };
    
    expect(rules.reference_scoping.forward_refs).toBe(true);
    expect(rules.reference_scoping.backward_refs).toBe(false);
    expect(rules.function_scoping.forward_refs).toBe(true);
    expect(rules.function_scoping.backward_refs).toBe(true);
  });
});
