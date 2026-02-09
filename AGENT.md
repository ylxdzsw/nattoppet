# Nattoppet - Bun Refactoring Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [File Structure](#2-file-structure)
3. [Core Components](#3-core-components)
4. [Syntax Reference](#4-syntax-reference)
5. [Template Reference](#5-template-reference)
6. [CLI Tools](#6-cli-tools)
7. [Dependencies & Bun Migration Plan](#7-dependencies--bun-migration-plan)
8. [Usage Examples from Research](#8-usage-examples-from-research)

---

## 1. Project Overview

### What is Nattoppet?

Nattoppet (Swedish for "nightcap") is a tiny macro-based markup language designed for creating documents, presentations, blog posts, and interactive web applications as single-file bundled HTML or executables.

**Key Features:**
- **Macro-based syntax** - Define and use reusable content blocks
- **Single-file output** - Everything bundled into one HTML file
- **Multiple templates** - Form, blog (koa), presentation (ppt), timeline (tml), Vue-style (vue), and math (katex)
- **Asset embedding** - Automatically inline images, fonts, CSS, JS, WASM, and JSON
- **Live reload development server** - Hot reload during development
- **Native executable builder** - Build desktop apps with Rust/WebView
- **CoffeeScript & Less support** - Compile these languages automatically
- **KaTeX math rendering** - Mathematical expressions

### Use Cases

1. **Blog posts** (koa template) - Long-form articles with navigation
2. **Presentations** (ppt template) - Slides with animations and transitions
3. **Forms/Web apps** (form template) - Interactive forms with JavaScript
4. **Timelines** (tml template) - Article-style content in columns
5. **Documentation** (vue template) - Vue.js-style documentation
6. **Math documents** (katex template) - Scientific papers with equations

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User .ymd file                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Tokenizer (compiler.ts)                                │
│  - Parse [name]: definitions                            │
│  - Parse [name]= functions                              │
│  - Parse [mixin] includes                               │
│  - Handle .ymd, .less, .css, .js, .coffee files         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Compiler (compiler.ts)                                 │
│  - Interpret references [name]                          │
│  - Execute functions [name]content                      │
│  - Handle indentation -> paragraphs                     │
│  - Dynamic scoping for functions                        │
│  - Lexical scoping for references                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Standard Library (stdlib.ts)                           │
│  - File I/O (read, rpath, extname, basename)            │
│  - Rendering (markdown, less, coffee, katex)            │
│  - Utilities (skip, capture_until, std_call)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Minified HTML Output                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

### Core TypeScript Files

| File | Purpose | Lines |
|------|---------|-------|
| `nattoppet.ts` | Main entry point - CLI compiler | 33 |
| `compiler.ts` | Tokenizer and compiler engine | 167 |
| `stdlib.ts` | Standard library functions | 129 |
| `nattoppet-dev.ts` | Development server with hot reload | 73 |
| `nattoppet-init.ts` | Project initialization wizard | 141 |
| `nattoppet-native.ts` | Native executable builder (Rust) | 109 |

### Template Files

Templates use a head/tail pattern:

| Template | Head | Tail | Assets |
|----------|------|------|--------|
| **form** | `form.head.ymd` | `form.tail.ymd` | `form.js`, `form.less` |
| **koa** | `koa.head.ymd` | `koa.tail.ymd` | `koa.less` |
| **ppt** | `ppt.head.ymd` | `ppt.tail.ymd` | `ppt.coffee`, `ppt.less` |
| **vue** | `vue.head.ymd` | `vue.tail.ymd` | `vue.less` |
| **tml** | `tml.head.ymd` | `tml.tail.ymd` | `tml.coffee`, `tml.less` |
| **katex** | `katex.head.ymd` | `katex.tail.ymd` | `katex.css` |

### Common Definitions

| File | Purpose |
|------|---------|
| `common.ymd` | Shared macros: require, img, h2, h3, h4, quote, code, link, file, etc. |

### LaTeX Support

| File | Purpose |
|------|---------|
| `manuscript.cls` | LaTeX class file for academic papers |

---

## 3. Core Components

### 3.1 Tokenizer (`compiler.ts:14-93`)

The tokenizer parses .ymd files into tokens and processes mixins.

**Pattern matching:**
```typescript
const pattern = /^(?:\[(.+?)\]([:=])|\[mixin\] (.+?)\n)/m
```

**Token types:**
1. **Code** - Raw HTML/content: `{ type: "code", content: string }`
2. **Ref** - Reference definition: `{ type: "ref", name: string, content: string }`
3. **Fn** - Function definition: `{ type: "fn", name: string, content: string }`
4. **Mixin** - File inclusion: `{ type: "mixin", path: string }`
5. **Raw** - Pre-processed content: `{ type: "raw", content: string }`

**Mixin resolution:**
- No extension: Loads `name.head.ymd` + `name.tail.ymd`
- `.ymd`: Inline the file
- `.less`: Compile with Less, wrap in `<style>`
- `.css`: Inline in `<style>`
- `.js`: Inline in `<script>`
- `.coffee`: Compile with CoffeeScript, wrap in `<script>`

### 3.2 Compiler (`compiler.ts:95-158`)

The compiler interprets tokens and generates HTML.

**Key algorithm:**
```
1. Create environment with stdlib + locals
2. Tokenize input
3. For each token:
   - Code: Interpret with _interpret
   - Raw: Output directly
4. Return concatenated output
```

**Interpretation (`_interpret`):**
- Scans for `[name]` patterns
- If preceded by `  ` (two spaces): Wrap in `<p>` tags (paragraph mode)
- Resolves references and functions by searching remaining tokens (later definitions)

**Scoping rules (define-after-calling):**
Both references `[name]:` and functions `[name]=` use **define-after-calling** semantics:
- Definitions are looked up in the remaining document flow (later in the file)
- Both can see and use definitions that appear AFTER their first usage
- References use `defs.slice(i+1)` to prevent recursion while allowing forward references
- Functions capture the `defs` array at call site, giving access to later definitions

Example:
```ymd
[section]Introduction          ← Uses [section] defined later

[section]=                     ← Definition appears AFTER usage
const title = capture_until('\n')
`</section><section><h2>${interpret(title)}</h2>`
```

### 3.3 Standard Library (`stdlib.ts`)

#### File Operations

```typescript
// Read file with various encodings
read(file: string, encoding = "utf-8"): string
// - "utf-8"/"utf8": Text content
// - "base64": Base64 encoded
// - "compressed-base64": Deflate compressed + base64

// Resolve path relative to base_dir
rpath(file: string): string

// Get file extension without dot
extname(file: string): string

// Get file basename
basename(file: string): string
```

#### Parsing Utilities

```typescript
// Skip N characters in remaining input
skip(n: number): void

// Capture text until delimiter found
capture_until(delimiter: string): string

// Parse standard function call syntax
std_call(hascontent = false): { opts: string[], args: string[], block?: string }
// Options: .option
// Arguments: (arg) or {arg}
// Block: >content< or space + inline
```

#### Rendering Functions

```typescript
// Compile CoffeeScript to JavaScript
render_coffee(str: string, options: any): string

// Compile Less to CSS
render_less(str: string): string

// Parse Markdown to HTML
render_markdown(str: string): string

// Render LaTeX to HTML
render_katex(str: string, displayMode = false): string
```

#### Compression (used for WASM/JSON embedding)

```typescript
// Compress using deflate-raw
compress_sync(data: ArrayBuffer): Uint8Array
```

---

## 4. Syntax Reference

### Reference Definitions `[name]:`

Define reusable content blocks:

```ymd
[title]: My Blog Post

Welcome to [title]!
```

**Output:**
```html
Welcome to My Blog Post!
```

> **Note:** Nattoppet uses **define-after-calling** semantics. Definitions can appear after they are first used in the document flow:
> ```ymd
> Title: [title]  ← Used here
>
> [title]: My Post  ← Defined here (after usage)
> ```

### Function Definitions `[name]=`

Define JavaScript functions that return HTML:

```ymd
[greet]=
const name = capture_until('\n')
`<h1>Hello, ${name}!</h1>`

[greet]World
```

**Output:**
```html
<h1>Hello, World!</h1>
```

### Template Mixins `[mixin] path`

Include template files:

```ymd
[mixin] koa

[title]: My Post

[section]Introduction

Welcome to my post.

[section]Conclusion

Thanks for reading!
```

### Function Calls `[name]` or `[name]content`

Call defined functions or references:

```ymd
[h2]Section Header

[h3]Subsection

Some text here.
```

### Paragraphs via Indentation

Two spaces create paragraphs:

```ymd
This is a paragraph.
  
This is another paragraph
with multiple lines.

This is a third paragraph.
```

**Output:**
```html
<p>This is a paragraph.</p>
<p>This is another paragraph with multiple lines.</p>
<p>This is a third paragraph.</p>
```

### Block Content with `>` and `<`

```ymd
[quote]>
This is a blockquote with
multiple lines.
<
```

### Options and Arguments

```ymd
[img].center.small(image.png, Alt text)

[link](https://example.com, Click here)

[require].my-style(main.css)
```

### Common Macros (from common.ymd)

```ymd
[require](file.css)           # Embed CSS/JS/Less/Coffee
[img](photo.jpg, Alt text)    # Embed image as data URI
[img].center(photo.jpg)       # With CSS class
[h2]Title                     # Heading level 2
[h3]Subtitle                  # Heading level 3
[quote]>content<              # Blockquote
[code](language)>content<     # Code block
[link](url, text)             # Hyperlink
[file](document.pdf, text)    # Download link
[sup](text)                   # Superscript
[$]inline math$               # KaTeX inline (katex template)
[$$]>display math<            # KaTeX display (katex template)
[#]comment text               # Comment (ignored)
[-]>list item<                # List item
```

---

## 5. Template Reference

### 5.1 Form Template

**Purpose:** Interactive forms with JavaScript

**Available macros:**
```ymd
[mixin] form

[title]: Calculator

[h3]Input
[text].first_name First Name
[number].age Age
[checkbox].subscribe Subscribe
```

**Generated structure:**
- Input fields with labels
- Run button
- Output `<pre>` element

**JavaScript integration:**
Define a global `run(args)` function that receives form values as object.

### 5.2 Koa Template

**Purpose:** Blog posts with section navigation

**Available macros:**
```ymd
[mixin] koa

[title]: My Blog Post

[section]Introduction
Content here...

[section]Methods
More content...

[section]Results
Even more...
```

**Features:**
- Full-height title section
- Alternating background colors
- Floating navigation menu (hamburger icon)
- Auto-generated section links

### 5.3 PPT Template

**Purpose:** Presentations with animations

**Available macros:**
```ymd
[mixin] ppt

[title]: My Presentation

[section].banner
Full-screen banner slide

[section]
Regular slide with

[h3]Animated bullet points

[span](2rem)  # Add vertical space
[foot]Footer text
```

**Animation classes:**
- `.click` - Advance on click
- `.delay` / `.delay.short` / `.delay.long` - Auto-advance after delay
- `.sim` - Show immediately
- `.slide` / `.fade` / `.rise` - Transition effects
- `.fx-color` (e.g., `.fx-chartreuse`) - Color transitions
- `.fast` / `.slow` - Speed modifiers

**CoffeeScript controls:**
- Auto-detects active slide based on scroll position
- Click to advance `.click` elements
- Timer for `.delay` elements

### 5.4 Vue Template

**Purpose:** Documentation with anchor links

**Available macros:**
```ymd
[mixin] vue

[title]: Documentation

[h2]Installation
Content...

[h3]Configuration
More content...
```

**Features:**
- Anchor links on h2/h3 headings
- Hover to show `#` link marker
- Clean, readable typography

### 5.5 TML (Timeline) Template

**Purpose:** Timeline-style articles

**Available macros:**
```ymd
[mixin] tml

[title]: Timeline

[article]Event 1
Description of event...

[article]Event 2
Another event...
```

**Features:**
- Horizontal scrolling on desktop
- Vertical on mobile
- Color-coded article borders (rotating colors)

### 5.6 Katex Template

**Purpose:** Math-heavy documents

**Available macros:**
```ymd
[mixin] katex

[title]: Math Paper

The equation [$]E = mc^2[$] is famous.

[$$]>
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
<
```

**Features:**
- Inline math with `[$]...[$]`
- Display math with `[$$]>...<`
- Auto-loaded KaTeX CSS

---

## 6. CLI Tools

### 6.1 nattoppet.ts

**Compile .ymd to HTML:**

```bash
# From file
bun run nattoppet.ts input.ymd > output.html

# With dev mode (no minification)
bun run nattoppet.ts input.ymd --dev > output.html

# From stdin
cat input.ymd | bun run nattoppet.ts > output.html
```

**Deno APIs to migrate:**
- `Deno.args` → `process.argv`
- `Deno.readTextFileSync` → `Bun.file().text()`
- `Deno.stdin.readable` → `process.stdin`
- `Deno.stdout.writable` → `process.stdout`

### 6.2 nattoppet-dev.ts

**Development server with hot reload:**

```bash
# Basic usage
bun run nattoppet-dev.ts file.ymd

# With build hook
bun run nattoppet-dev.ts file.ymd make build
```

**Features:**
- Serves on port 3939
- Recompiles on each request
- Runs optional hook command before compile
- Opens browser automatically
- Serves static files from current directory

**Deno APIs to migrate:**
- `Deno.listen` → `Bun.serve`
- `Deno.serveHttp` → Built into `Bun.serve`
- `Deno.run` → `Bun.spawn`
- `Deno.open` → `Bun.file`
- `Deno.env.get` → `process.env`
- `Deno.build.os` → `process.platform`

### 6.3 nattoppet-init.ts

**Initialize new projects:**

```bash
bun run nattoppet-init.ts form
```

**Interactive prompts:**
1. WASM library name (optional)
2. GitHub workflow generation

**Creates:**
- `main.ymd` - Entry file with template
- `main.js` - JavaScript logic
- `Cargo.toml` + `.rs` - Rust WASM (optional)
- `.github/workflows/pages.yml` - CI/CD

**Deno APIs to migrate:**
- `Deno.writeTextFileSync` → `Bun.write`
- `Deno.mkdirSync` → `fs.mkdirSync`
- `prompt()` - Use `readline` or alternative

### 6.4 nattoppet-native.ts

**Build native desktop apps:**

```bash
# Initialize native app structure
bun run nattoppet-native.ts init

# Bundle HTML
bun run nattoppet-native.ts bundle file.ymd

# Build executable
bun run nattoppet-native.ts build file.ymd
```

**Creates:**
- `native/` directory with Rust project
- Embeds HTML as `native/target/bundle.html`
- Builds with cargo

**Deno APIs to migrate:**
- All same as nattoppet.ts
- `Deno.run` with cwd → `Bun.spawn` with cwd

---

## 7. Dependencies & Bun Migration Plan

### 7.1 Current Deno Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `path` | `https://deno.land/std@0.181.0/path/mod.ts` | Path manipulation |
| `base64` | `https://deno.land/std@0.181.0/encoding/base64.ts` | Base64 encoding |
| `html-minifier-terser` | `npm:html-minifier-terser@^6.1.0` | HTML minification |
| `marked` | `npm:marked@^4.0.10` | Markdown parsing |
| `katex` | `npm:katex@^0.16.2` | LaTeX rendering |
| `less` | `npm:less@^4.1.3` | Less compilation |
| `coffee` | `https://cdn.skypack.dev/coffeescript@^2.6.1` | CoffeeScript |
| `zlib` | `node:zlib` | Compression |

### 7.2 Bun Equivalents

| Deno API | Bun/Node Equivalent | Notes |
|----------|---------------------|-------|
| `Deno.args` | `process.argv.slice(2)` | Same functionality |
| `Deno.readTextFileSync` | `fs.readFileSync(path, 'utf-8')` or `Bun.file(path).text()` | Bun.file is preferred |
| `Deno.readFileSync` | `fs.readFileSync(path)` | Returns Buffer |
| `Deno.writeTextFileSync` | `fs.writeFileSync(path, content)` or `Bun.write(path, content)` | |
| `Deno.writeFileSync` | `fs.writeFileSync(path, content)` | |
| `Deno.mkdirSync` | `fs.mkdirSync(path, { recursive: true })` | |
| `Deno.statSync` | `fs.statSync(path)` | Same API |
| `Deno.readDirSync` | `fs.readdirSync(path)` | Returns array |
| `Deno.cwd()` | `process.cwd()` | |
| `Deno.exit(code)` | `process.exit(code)` | |
| `Deno.env.get` | `process.env.VAR` | |
| `Deno.build.os` | `process.platform` | Values differ slightly |
| `Deno.listen` | `Bun.serve()` | Significant API change |
| `Deno.serveHttp` | Built into `Bun.serve()` | |
| `Deno.run` | `Bun.spawn()` | API is different |
| `Deno.open` | `Bun.file()` | |
| `Deno.copyFile` | `fs.promises.copyFile()` | |
| `new Response(Deno.stdin.readable)` | `Bun.stdin.stream()` or read manually | |
| `TextEncoderStream` | `new TextEncoder()` + manual streaming | Not available in Bun |

### 7.3 NPM Dependencies (package.json)

```json
{
  "dependencies": {
    "html-minifier-terser": "^7.2.0",
    "marked": "^9.1.6",
    "katex": "^0.16.9",
    "less": "^4.2.0",
    "coffeescript": "^2.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/bun": "^1.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 7.4 Migration Strategy

1. **Phase 1: Replace stdlib imports**
   - `https://deno.land/std@0.181.0/path/mod.ts` → `node:path`
   - `https://deno.land/std@0.181.0/encoding/base64.ts` → Use `Buffer.from().toString('base64')`

2. **Phase 2: Replace Deno.* APIs**
   - File operations → Node fs API or Bun.file
   - Process operations → Node process API
   - Network operations → Bun.serve

3. **Phase 3: Update CLI tools**
   - Rewrite nattoppet.ts with Bun APIs
   - Rewrite nattoppet-dev.ts with Bun.serve
   - Update nattoppet-init.ts for Bun
   - Update nattoppet-native.ts for Bun

4. **Phase 4: Testing**
   - Ensure all tests pass with Bun
   - Test all templates
   - Test native app building

5. **Phase 5: Optimization**
   - Use Bun-specific features where beneficial
   - Keep Node.js compatibility

### 7.5 Key Migration Challenges

1. **Path resolution with `import.meta.url`**
   - Deno: `new URL(path, import.meta.url)` works directly
   - Bun: May need `fileURLToPath` from `node:url`

2. **CoffeeScript import**
   - Deno uses CDN import: `https://cdn.skypack.dev/coffeescript`
   - Bun: Install via npm: `coffeescript` package

3. **HTTP server**
   - Deno: Manual TCP + HTTP parsing
   - Bun: Built-in `Bun.serve` is much simpler

4. **File watching/development**
   - Consider using `Bun.watch` if available, or chokidar

5. **Compression API**
   - Currently uses `node:zlib` which works in both

---

## 8. Usage Examples from Research

### 8.1 Convex Alchemist (Game Web App)

**Repository:** `ylxdzsw/convex_alchemist`

```ymd
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="author" content="ca@ylxdzsw.com">
<meta name="license" content="MIT">
<meta name="github" content="https://github.com/ylxdzsw/convex_alchemist">

<title>Convex Alchemist</title>

[require](target/wasm32-unknown-unknown/release/ca.wasm)

[#] Chrome only load font if it appear BOTH inside and outside the shadow dom, even when inlined as data url
[require].style-katex(lib/katex.css)
[require](lib/katex.js)
[require](lib/streams-polyfill.js)
[require](main.less)
[require](main.js)

[require](Card.html)
[require](Katex.html)
[require](Resource.html)
[require](Text.html)

<div class="column">

[require](status.html)
[require](inventory.html)
[require](buildings.html)

</div> <div class="column">

[require](relics.html)
[require](log.html)
[require](settings.html)

</div>

<div id="bottom-notice">
Copyright © 2023-2025: ca@ylxdzsw.com <br>
<a href="https://github.com/ylxdzsw/convex_alchemist">Source code available under the MIT license</a>
</div>

[mixin] common.ymd
```

**Key features demonstrated:**
- WASM integration (Rust compiled to WASM)
- Multiple HTML component files
- CSS and JS inlining
- KaTeX for math rendering
- Custom layout with columns

### 8.2 Blog Post Example (Backtesting Tool)

**Repository:** `ylxdzsw/ylxdzsw.github.io/posts/24/2024-01-backtesting`

```ymd
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="author" content="root@ylxdzsw.com">
<meta name="license" content="MIT">
<meta name="github" content="https://github.com/ylxdzsw/ylxdzsw.github.io/tree/master/posts/24/2024-01-backtesting">

<title>倒钱落海模拟器</title>

[require](klinecharts.min.js)
[require](codemirror.js)
[require](codemirror.css)
[require](codemirror-javascript.js)

[require](main.less)
[require](main.js)
[require](Card.html)

[require](bitfinex_btcusd_1d.json)
[require](aapl.json)
[require](ndx100.json)
[require](sa405_15m.json)
[require](sh513130_1d.json)

<div class="column">

[require](candles.html)
[require](data.html)

</div> <div class="column">

[require](strategy.html)
[require](log.html)
[require](disclaimer.html)

</div>

<div id="bottom-notice">
Copyright © 2024: root@ylxdzsw.com <br>
[link](https://github.com/ylxdzsw/ylxdzsw.github.io/tree/master/posts/24/2024-01-backtesting) Source code available under the MIT license
</div>

[mixin] common.ymd
```

**Key features demonstrated:**
- Third-party library inlining (CodeMirror, KLineCharts)
- JSON data embedding (compressed automatically)
- Complex interactive application
- Multi-column layout

### 8.3 Build System Integration

**File:** `ylxdzsw.github.io/build.ts`

The blog uses nattoppet as part of a build pipeline:

```typescript
class YMDPost extends Post {
    async compile() {
        const nattoppet_url = "https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts"
        const cmd = [
            "bash",
            "-c",
            `deno run -A --unstable --no-check ${nattoppet_url} ${this.path}/main.ymd > ${result}`
        ]
        const child = Deno.run({ cmd })
        await child.status()
    }
}
```

**Key integration patterns:**
- Remote nattoppet execution via `deno run` with URL
- Automatic hash-based caching
- RSS feed generation
- Index page generation

---

## Quick Reference Card

### Common Patterns

```ymd
# Basic template usage
[mixin] koa
[title]: Post Title

# Headings
[h2]Section
[h3]Subsection
[h4]Sub-subsection

# Images
[img](photo.jpg, Alt text)
[img].center(photo.jpg)
[img].small(photo.jpg)

# Code
[code](javascript)>const x = 1;<  # Inline
[code]>multi
line
code<                            # Block

# Links
[link](https://example.com, Click here)

# Lists (manual)
<ul>
[-]>Item 1<
[-]>Item 2<
</ul>

# Quotes
[quote]>
Quoted text
<

# Files
[file](document.pdf, Download)

# Comments
[#] This is a comment

# Raw eval
[eval] console.log('side effect')
[eval*] console.log('no output')  # Returns empty string
```

### File Types Supported in [require]

| Extension | Treatment |
|-----------|-----------|
| `.js` | Inline in `<script>` |
| `.css` | Inline in `<style>` |
| `.less` | Compile, inline in `<style>` |
| `.coffee` | Compile, inline in `<script>` |
| `.md` | Parse as Markdown |
| `.wasm` | Embed as compressed base64, auto-load |
| `.json` | Embed as compressed base64, auto-parse |
| `.html` | Inline as-is |
| `.svg`, `.png`, `.jpg` | Embed as data URI |

### Environment Variables (nattoppet-dev)

| Variable | Purpose |
|----------|---------|
| `BROWSER` | Override browser command (default: auto-detect) |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Compilation error |
| Non-zero | Hook command failed (dev mode) |

---

*Generated for nattoppet Bun refactoring project*
