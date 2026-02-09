# Nattoppet Tests

This directory contains comprehensive tests for the nattoppet project.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test test/compiler.test.ts
```

## Test Structure

### `compiler.test.ts`
Tests for the tokenizer and compiler:
- Token parsing (refs, functions, mixins)
- Reference resolution
- Function execution
- Paragraph handling
- Scoping (lexical vs dynamic)
- Error handling

### `stdlib.test.ts`
Tests for the standard library:
- File operations (read, rpath, extname, basename)
- Parsing utilities (skip, capture_until, std_call)
- Rendering functions (markdown, less, coffee, katex)
- Environment binding

### `integration.test.ts`
End-to-end integration tests:
- Basic compilation
- All template types (koa, form, ppt, vue, tml, katex)
- Common macros from common.ymd
- Complex scenarios (nested calls, stateful macros)
- Edge cases (empty input, unicode, special chars)

### `fixtures/`
Sample .ymd files for testing:
- `simple.ymd` - Basic vue template example
- `form-test.ymd` - Form template with inputs
- `koa-test.ymd` - Koa template blog post

## Writing New Tests

Use the Bun test API:

```typescript
import { describe, it, expect } from "bun:test";
import { compile } from "../compiler.ts";
import stdlib from "../stdlib.ts";

describe("Feature Name", () => {
  it("should do something", async () => {
    const input = `[test]: value\n\n[test]`;
    const output = await compile(input, { ...stdlib, base_dir: "." });
    expect(output).toContain("value");
  });
});
```

## Test Environment

- **Runtime:** Bun
- **Test Framework:** bun:test
- **TypeScript:** Enabled
- **Coverage:** Use `bun test --coverage`
