nattoppet
=========

A tiny markup language and themes for making documents, slides, or web apps as single-file bundled html or executables.

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


### History

- 1.0: This project started as an experiment of co.js to replicate gulp.js, when async/await was not a thing and wind.js was the cool guy that everyone was talking about.
- 2.0: Later I decided to make ymd.js, a custom LaTeX-style macro-based markup language for blogging, and turned nattoppet a bundler. Promise landed on JavaScript, and async/await was available with babel.
- 3.0: I became a minimalist and stripped down all dependencies, merged ymd.js and nattoppet, and flattened the directory. I have also migrated to Deno to further reduce the nodejs clutters.
- 4.0: AI came. As an experimental project, nattoppet was put to test AI. Kimi 2.5 successfully ported it from Deno to Bun in half an hour, with all posts on my blog rebuilds without error. It made me feel empty, but I have to embrace it. This project will be fully vibed from now on.
