nattoppet
=========

A tiny markup language and themes for making documents, slides, or web apps as single-file bundled html or executables.

### Usage

Compile a nattoppet file:

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts in.ymd > out.html
```

Compile a nattoppet file but don't minimize (for debugging):

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts in.ymd --dev > out.html
```

Open a browser to preview a nattoppet file; rebuild every time the page is refreshed.

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-dev.ts in.ymd
```

Build a double-clickable executable for the page

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-native.ts init
$ (edit the metadata as needed)
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-native.ts build in.ymd
```
