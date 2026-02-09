import { describe, it, expect, beforeEach } from "bun:test";
import stdlib from "../stdlib.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, "fixtures");

describe("stdlib - File Operations", () => {
  const env = {
    ...stdlib,
    base_dir: testDir,
    remaining: ""
  };

  beforeEach(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  describe("rpath", () => {
    it("should resolve relative paths", () => {
      const result = stdlib.rpath.call(env, "test.txt");
      expect(result).toBe(path.join(testDir, "test.txt"));
    });

    it("should keep absolute paths unchanged", () => {
      const absolute = "/absolute/path.txt";
      const result = stdlib.rpath.call(env, absolute);
      expect(result).toBe(absolute);
    });
  });

  describe("extname", () => {
    it("should get extension without dot", () => {
      expect(stdlib.extname("file.txt")).toBe("txt");
      expect(stdlib.extname("file.min.js")).toBe("js");
      expect(stdlib.extname("file")).toBe("");
    });
  });

  describe("basename", () => {
    it("should get filename", () => {
      expect(stdlib.basename("/path/to/file.txt")).toBe("file.txt");
      expect(stdlib.basename("file.txt")).toBe("file.txt");
    });
  });

  describe("read", () => {
    it("should read UTF-8 file", () => {
      const testFile = path.join(testDir, "read_test.txt");
      fs.writeFileSync(testFile, "Hello World");
      
      const result = stdlib.read.call(env, testFile, "utf-8");
      expect(result).toBe("Hello World");
      
      fs.unlinkSync(testFile);
    });

    it("should read file as base64", () => {
      const testFile = path.join(testDir, "base64_test.txt");
      fs.writeFileSync(testFile, "Hello");
      
      const result = stdlib.read.call(env, testFile, "base64");
      expect(result).toBe(Buffer.from("Hello").toString("base64"));
      
      fs.unlinkSync(testFile);
    });
  });
});

describe("stdlib - Parsing Utilities", () => {
  describe("skip", () => {
    it("should skip characters in remaining", () => {
      const env = {
        remaining: "hello world",
        skip: stdlib.skip
      };
      
      stdlib.skip.call(env, 6);
      expect(env.remaining).toBe("world");
    });
  });

  describe("capture_until", () => {
    it("should capture until delimiter", () => {
      const env = {
        remaining: "hello world end",
        skip: stdlib.skip,
        capture_until: stdlib.capture_until
      };
      
      const result = stdlib.capture_until.call(env, " end");
      expect(result).toBe("hello world");
      expect(env.remaining).toBe("");
    });

    it("should capture remaining if delimiter not found", () => {
      const env = {
        remaining: "hello world",
        skip: stdlib.skip,
        capture_until: stdlib.capture_until
      };
      
      const result = stdlib.capture_until.call(env, "xyz");
      expect(result).toBe("hello world");
      expect(env.remaining).toBe("");
    });
  });

  describe("std_call", () => {
    it("should parse options", () => {
      const env = {
        remaining: ".opt1.opt2",
        skip: stdlib.skip,
        std_call: stdlib.std_call
      };
      
      const result = stdlib.std_call.call(env);
      expect(result.opts).toEqual(["opt1", "opt2"]);
      expect(result.args).toEqual([]);
    });

    it("should parse parenthesis arguments", () => {
      const env = {
        remaining: ".opt(arg1)(arg2)",
        skip: stdlib.skip,
        std_call: stdlib.std_call
      };
      
      const result = stdlib.std_call.call(env);
      expect(result.opts).toEqual(["opt"]);
      expect(result.args).toEqual(["arg1", "arg2"]);
    });

    it("should parse brace arguments", () => {
      const env = {
        remaining: "{arg1}{arg2}",
        skip: stdlib.skip,
        std_call: stdlib.std_call
      };
      
      const result = stdlib.std_call.call(env);
      expect(result.args).toEqual(["arg1", "arg2"]);
    });

    it("should parse block content with >", () => {
      const env = {
        remaining: ">block content<",
        skip: stdlib.skip,
        capture_until: stdlib.capture_until,
        std_call: stdlib.std_call
      };
      
      const result = stdlib.std_call.call(env, true);
      expect(result.block).toBe("block content");
    });

    it("should parse inline content when hascontent is true", () => {
      const env = {
        remaining: " inline content",
        skip: stdlib.skip,
        capture_until: stdlib.capture_until,
        std_call: stdlib.std_call
      };
      
      const result = stdlib.std_call.call(env, true);
      expect(result.block).toBe("inline content");
    });
  });
});

describe("stdlib - Rendering", () => {
  describe("render_markdown", () => {
    it("should render basic markdown", () => {
      const result = stdlib.render_markdown("# Hello\n\nWorld");
      expect(result).toContain("<h1>");
      expect(result).toContain("Hello");
      expect(result).toContain("</h1>");
      expect(result).toContain("<p>");
      expect(result).toContain("World");
    });

    it("should render lists", () => {
      const result = stdlib.render_markdown("- item 1\n- item 2");
      expect(result).toContain("<ul>");
      expect(result).toContain("<li>");
    });
  });

  describe("render_less", () => {
    it("should compile Less to CSS", () => {
      const lessCode = `
        @color: red;
        body { color: @color; }
      `;
      const result = stdlib.render_less(lessCode);
      expect(result).toContain("color");
      expect(result).toContain("red");
    });

    it("should handle nested rules", () => {
      const lessCode = `
        .parent {
          color: red;
          .child { color: blue; }
        }
      `;
      const result = stdlib.render_less(lessCode);
      expect(result).toContain(".parent");
      expect(result).toContain(".child");
    });
  });

  describe("render_coffee", () => {
    it("should compile CoffeeScript to JavaScript", () => {
      const coffeeCode = "x = 1 + 2";
      const result = stdlib.render_coffee(coffeeCode, { bare: true });
      expect(result).toContain("var");
      expect(result).toContain("x");
    });

    it("should compile functions", () => {
      const coffeeCode = "square = (x) -> x * x";
      const result = stdlib.render_coffee(coffeeCode, { bare: true });
      expect(result).toContain("function");
    });
  });

  describe("render_katex", () => {
    it("should render inline math", () => {
      const result = stdlib.render_katex("x^2", false);
      expect(result).toContain("<span");
      expect(result).toContain("math");
    });

    it("should render display math", () => {
      const result = stdlib.render_katex("\\int_0^1 x dx", true);
      expect(result).toContain("<span");
      expect(result).toContain("math");
    });
  });
});

describe("stdlib - Integration with environment", () => {
  it("should bind functions to environment", async () => {
    const { compile } = await import("../compiler.ts");
    
    const input = `[test]=
const { opts, args } = std_call()
\`opts:\${opts.length}, args:\${args.length}\`

[test].opt1.opt2(arg1)(arg2)`;
    
    const output = await compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("opts:2");
    expect(output).toContain("args:2");
  });
});
