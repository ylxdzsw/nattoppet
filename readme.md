nattoppet
=========

A tiny markup language and several themes for making documents, slides, or web apps as single-file bundled html or
executables.

### Usage

compile a nattoppet file:

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts in.ymd > out.html
```

compile a nattoppet file but don't minimize (for debugging):

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts in.ymd --dev > out.html
```

watch a nattoppet file and rebuild it whenever it changes; open a browser to view the compiled page

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-dev.ts in.ymd
```

build a double-clickable executable for the page

```
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-native.ts init
$ (edit the metadata as needed)
$ deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet-native.ts build in.ymd
```

Without installing deno:

```
curl -fsS https://deno.ylxdzsw.com/https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts | bash -s - in.ymd > out.html
```
