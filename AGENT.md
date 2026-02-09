# Nattoppet

A tiny macro-based markup language for creating single-file HTML documents, presentations, and web apps.

## Quick Start

```bash
# Compile a file
bun run nattoppet.ts input.ymd > output.html

# Development mode (no minification)
bun run nattoppet.ts input.ymd --dev > output.html

# Development server
bun run nattoppet-dev.ts input.ymd

# Initialize project
bun run nattoppet-init.ts form
```

## Syntax

```ymd
[mixin] vue

[title]: My Page

[h2]Section Header
This is paragraph text.

[link](https://example.com, Click here)

[code](javascript)>
console.log("Hello");
<
```

### Core Syntax

- `[name]: content` - Reference definition (returns content)
- `[name]=` - Function definition (JavaScript code)
- `[name]argument` - Call a reference or function
- `[mixin] template` - Include template files
- `  indented text` - Creates paragraph

### Built-in Functions (common.ymd)

- `[require](file)` - Embed CSS/JS/HTML/WASM/JSON files
- `[img](file, alt)` - Embed images as base64
- `[h2]`, `[h3]`, `[h4]` - Headings
- `[-]` - List items
- `[link](url, text)` - Links
- `[code](lang)>content<` - Code blocks

## Templates

| Template | Use Case | Key Features |
|----------|----------|--------------|
| `koa` | Blog posts | Navigation, sections, alternating backgrounds |
| `form` | Interactive forms | Input fields, checkboxes, buttons |
| `vue` | Documentation | Anchor links, clean typography |
| `tml` | Timeline articles | Horizontal scrolling, color borders |
| `ppt` | Presentations | Slides, animations |
| `katex` | Math documents | KaTeX math rendering |

## File Structure

- `nattoppet.ts` - CLI compiler
- `compiler.ts` - Tokenizer and compiler
- `stdlib.ts` - Standard library
- `nattoppet-dev.ts` - Dev server
- `nattoppet-init.ts` - Project initialization
- `common.ymd` - Built-in macros
- `*.head.ymd`, `*.tail.ymd` - Template parts

## Scoping Rules

**Forward references only** - definitions must come AFTER usage:

```ymd
Content: [title]          # Usage first

[title]: My Title         # Definition after
```

This applies to both `[name]:` references and `[name]=` functions.

## Dependencies

- `bun` >= 1.0.0
- `coffeescript`, `html-minifier-terser`, `marked`, `katex`, `less`

## Architecture

```
.ymd input → Tokenizer → Compiler → HTML output
                ↓            ↓
            Mixins      stdlib
           (.head/.tail) (read, render)
```

## License

MIT
