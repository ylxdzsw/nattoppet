nattoppet
=========

A tiny markup language and themes for making documents, slides, or web apps as single-file bundled html or executables.

**Now powered by Bun!** 🚀

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone this repository
git clone https://github.com/ylxdzsw/nattoppet.git
cd nattoppet

# Install dependencies
bun install
```

### Usage

Compile a nattoppet file:

```bash
bun run nattoppet.ts in.ymd > out.html
```

Compile a nattoppet file but don't minimize (for debugging):

```bash
bun run nattoppet.ts in.ymd --dev > out.html
```

Open a browser to preview a nattoppet file; rebuild every time the page is refreshed:

```bash
bun run nattoppet-dev.ts in.ymd
```

Initialize a new project:

```bash
bun run nattoppet-init.ts form
```

Build a double-clickable executable for the page:

```bash
bun run nattoppet-native.ts init
# (edit the metadata as needed)
bun run nattoppet-native.ts build in.ymd
```

### Migration from Deno

This project has been migrated from Deno to Bun. See [MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md) for details.

### Templates

- **koa** - Blog posts with navigation
- **form** - Interactive forms
- **ppt** - Presentations with animations
- **vue** - Documentation style
- **tml** - Timeline articles
- **katex** - Math rendering
