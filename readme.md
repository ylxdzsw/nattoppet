nattoppet
=========

A tiny markup language and several themes for making documents, slides, or web apps as single-file bundled html or
executable.

### Usage

compile a nattoppet file:

```
$ npm exec nattoppet in.ymd > out.html
```

compile a nattoppet file but don't minimize (for debugging):

```
$ npm exec nattoppet in.ymd --dev > out.html
```

watch a nattoppet file and rebuild it whenever it changes; open a browser to view the compiled page

```
$ npm exec nattoppet-dev in.ymd
```

build a double-clickable executable for the page

```
$ npm exec nattoppet-native init
$ (edit the metadata as needed)
$ npm exec nattoppet-native build in.ymd
```
