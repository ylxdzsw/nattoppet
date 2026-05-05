nattoppet
=========

A tiny macro-based markup language and themes for making documents, slides, or web apps as single-file bundled HTML or executables. Originally a LaTeX-style blogging tool, now fully vibed as a minimal zero-config bundler powered by Bun.

## Goal / Motivation

- Minimize configuration and dependencies while retaining expressive power through macros.
- Produce self-contained single-file outputs (HTML or native executables) from markup source.
- Embrace AI-assisted development as a fully "vibed" experimental project.

## Features / Specification

- **Macro-based markup**: Define and invoke macros with `[name]` (reference) or `[name]=` (function).
- **Mixin system**: Include templates, CSS, JS, or raw assets via `[mixin] path`.
- **Bundled output**: Produces minified single-file HTML; optional native executables via Rust/web-view.
- **Built-in rendering**: Markdown (marked), LaTeX math (KaTeX), Less CSS, CoffeeScript.
- **Dev server**: Live-reload preview server (`nattoppet-dev`) on port 3939.
- **Project scaffolding**: Initialize new projects with form templates and optional WASM/GitHub Pages workflows.

## Designs

- **Runtime**: Bun (ES modules, native TypeScript execution).
- **Language**: TypeScript with strict mode, targeting ES2022.
- **Architecture**: Core compiler (`compiler.ts`) tokenizes and interprets macros; standard library (`stdlib.ts`) provides file I/O and renderers; CLI tools (`nattoppet.ts`, `nattoppet-dev.ts`, etc.) wrap the compiler.
- **Testing**: `bun:test` framework.
- **CI/CD**: GitHub Actions builds native binaries for Linux, macOS, and Windows on tag push and releases as draft.
- **Error handling**: Currently throws plain strings (legacy style); no structured error types.

## File structures

| File / Dir | Description |
|------------|-------------|
| `nattoppet.ts` | Main CLI compiler. Reads `.ymd` from file or stdin, emits minified HTML. |
| `nattoppet-dev.ts` | Dev server with live reload and optional build hooks. |
| `nattoppet-init.ts` | Project initializer (templates, WASM scaffold, GitHub Pages workflow). |
| `nattoppet-native.ts` | Native app bundler (Rust + web-view wrapper for desktop executables). |
| `compiler.ts` | Core tokenizer and interpreter for the macro language. |
| `stdlib.ts` | Standard library: file utils, compression, and renderers (md, less, coffee, katex). |
| `*.ymd` | Built-in theme/mixin templates (vue, form, koa, ppt, tml, katex, common). |
| `*.css`, `*.js` | Static assets referenced by mixins. |
| `tests/` | Integration tests organized by feature, each subfolder contains a test file and fixtures. |
| `.github/workflows/ci.yml` | CI pipeline: install, test, build native binaries, draft release. |

## Development

### Install dependencies
```bash
bun install
```

### Build
```bash
# Bundle for distribution
bun run build
```

### Test
```bash
# Run all tests
bun test

# Run a single test file
bun test tests/scoping/scoping.test.ts

# Run tests in watch mode
bun test --watch

# Run with coverage
bun test --coverage
```

### Run / Dev
```bash
# Compile a file
bun run nattoppet.ts in.ymd > out.html

# Compile in dev mode (no minification)
bun run nattoppet.ts in.ymd --dev > out.html

# Start dev server
bun run nattoppet-dev.ts in.ymd

# Initialize a new project
bun run nattoppet-init.ts form
```

## Code Style

- **Indentation**: 4 spaces everywhere (core source and tests).
- **Quotes**: Single quotes for strings.
- **Semicolons**: Omit optional semicolons.
- **Imports**: Use `node:` prefix for Node.js built-ins (e.g., `node:fs`, `node:path`). Import with `.ts` extensions.
- **Naming**:
  - `camelCase` for exported functions and variables (`tokenize`, `compile`).
  - `snake_case` for internal/local helpers (`fetch_text_file`, `resolve_mixin_path`).
- **Types**: TypeScript with explicit types where helpful; `any` is used pragmatically in stdlib and env objects due to dynamic macro scoping. No static type checker is enforced.
- **Error handling**: Currently throws plain strings (e.g., `throw \`mixin not found: ${path}\``). Prefer this style for consistency within the existing codebase.
- **Comments**: Sparse; explain non-obvious regex or scoping behavior in compiler.

## Reference Projects

The following real-world projects demonstrate different nattoppet usage patterns and can be used for regression testing or as learning material.

- **[convex_alchemist](https://github.com/ylxdzsw/convex_alchemist)** — A complex browser game built almost entirely with raw HTML scaffolding and the `[require]` macro. It loads WASM (`ca.wasm`), external JS libraries, Less stylesheets, and HTML Web Components (`Card.html`, `Katex.html`, etc.) via `[require](path)`. The project shows how `[require]` options map to element IDs (e.g., `[require].style-katex(...)`), and demonstrates the no-theme pattern where the author manually writes `<!doctype html>`, `<meta>`, and `<title>` instead of using a theme mixin. It also makes heavy use of custom elements and the `[#]` comment macro.

- **[CC0 (web)](https://github.com/ylxdzsw/CC0/blob/master/web/index.ymd)** — A Chinese checkers AI frontend that embeds a Rust WASM module. Notably, it uses a custom `[wasm]=` macro to read the `.wasm` file as base64 and then inlines it inside a handwritten `<script>` block that calls `WebAssembly.instantiate`. It also loads CoffeeScript modules (`index.coffee`, `api.coffee`, `board.coffee`, etc.) and an HTML UI shell via `[require]`. This project predates the built-in `require` WASM embedding in `common.ymd` and therefore shows the manual base64-inlining pattern. External CDN dependencies (SVG.js, onnxruntime-web) are included with plain `<script src="...">` tags.

- **[ylxdzsw.github.io](https://github.com/ylxdzsw/ylxdzsw.github.io)** — The author's blog containing dozens of posts that exercise nearly every built-in theme. Posts use `[mixin] vue` for standard articles with auto-anchored headers, `[mixin] form` for interactive JavaScript calculators (e.g., prime-spiral, ducks-in-pool, backtesting), `[mixin] tml` for timeline-style layouts, and `[mixin] katex` for math-heavy articles. It demonstrates `[$]` / `[$$]` inline and display math, `[quote]`, `[code]`, `[link]`, and the `[cn]` macro for CJK text formatting. Some posts mix raw HTML scaffolding without a theme mixin (e.g., the Blockly-based backtesting-builder), showing the flexibility of the language.

- **[dachu](https://github.com/ylxdzsw/dachu/blob/master/main.ymd)** — A minimal restaurant ordering mini-program. The entire `.ymd` file is just raw HTML meta tags, three `[require]` calls (`main.html`, `main.less`, `main.js`), and `[mixin] common.ymd`. It demonstrates the simplest possible nattoppet pattern: no theme mixin, no macros beyond `require`, and all complexity pushed into vanilla JS/LESS/HTML files that get inlined into a single bundled output.

- **[slime-trait-calculator](https://github.com/ylxdzsw/slime-trait-calculator/blob/master/main.ymd)** — A game probability calculator that uses `[mixin] form` for auto-generated input fields (`[number]`, `[checkbox]`) and a Run button. It includes a local KaTeX stylesheet via `[mixin] assets/katex.css` rather than the built-in `katex` mixin, then writes extensive LaTeX with `[$]` and `[$$]>>...<<` multi-line display math. The `[require](main.js)` provides the computation logic. This is the canonical example of combining the `form` theme with math rendering for interactive technical calculators.

## Notes

- The compiler uses `eval` (via `(1, eval)`) to execute macro functions in a dynamically scoped environment. This is a core design choice for macro expressiveness.
- Forward references are supported: macros defined later in the file can be referenced earlier.
- Mixin paths without extensions resolve to `.ymd` if an exact file does not exist.
- The project intentionally avoids formatters/linters and `tsconfig.json` to stay minimal; Bun transpiles TypeScript at runtime without static type checking.
- Version 4.0 is a Bun port from the previous Deno-based 3.0, completed as an AI experiment.
