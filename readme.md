Nattoppet
=========

A tiny static blog generator for [my own blog](http://blog.ylxdzsw.com)

#### Usage

```
$ npm install -g nattoppet
$ nattoppet build
```

for more information about nattoppet CLI util, use `nattoppet --help`

#### Blog Structure

"A post" means a folder that contains `post.json`. Posts can be placed on directories that are not posts.

`post.json` contains following fields:

```
{
    "title": "Hello World!",             // the title
    "date": "2015-12-17",                // the date
    "entry": "main",                     // entry html file without suffix
    "label": ["lifestyle"],              // keywords of this post
    "no-compile": ["something.coffee"],  // Optional: files that shouldn't compile
    "no-copy": ["something.md"]          // Optional: files that shouldn't copy to final site
}
```

#### Template Variables

Use `nattoppet::xxx` or `"-nattoppet::xxx-"` in files to indicate variable.

Avalables are:

    Template.dir - directory of templates
