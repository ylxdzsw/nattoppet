Nattoppet
=========

A tiny markup language and several "stdlib" themes for making documents and slides as single-file bundled html.

### Usage

No installation required using `npx`:

```
$ npx nattoppet file.ppt.ymd
```

for more information about nattoppet CLI util, try `npx nattoppet --help`.

### about ymd.js

`ymd` is a very simple markup language. A `ymd` file contains 3 different elements: `Text`, `FnDef` and `RefDef`. A `FnDef`
is a block starts with `\n\[\w+\]=` and ends with an empty line or another `FnDef` or `RefDef`. `RefDef` is similar except
for it uses `\n\[\w+\]:`.

The parsing is basically as follows:

1. Scan the whole document and divide into a list of `Text`, `FnDef` and `RefDef`;
2. For each `Text`, directly write the stream to the output until invocations (`\[\w+\]`) are found;
    - For function invocations, stop the excution and pass all remaining text to the function. A typical function will parse part of the text and recursively pass the remaining text back to the iterpreter;
    - For reference invocations, interpret the content of the reference, then insert it into the original text and continue;
3. After the interpretation, run another pass that segment the document with `<p></p>`.
