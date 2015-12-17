Nattoppet
=========

A tiny static blog generator for [my own blog](http://www.ylxdzsw.com)

#### 使用方法

```
$ npm install -g nattoppet
$ nattoppet build
```

#### 目录结构

"A post" means a folder that contains `post.json`. Posts can be placed on directories that are not posts.

`post.json` contains following fields:

```
{
    "title": "Hello World!",             // the title
    "date": "2015-12-17",                // the date
    "entry": "main",                     // entry html file without suffix
    "discription": "hello world!",       // Optional: discription for this post
    "cover": "me.jpg",                   // Optional: cover image for this post
    "no-compile": ["something.coffee"],  // Optional: files that shouldn't compile
    "no-copy": ["something.md"]          // Optional: files that shouldn't copy to _site
}
```

#### 模板变量

Use `nattoppet::xxx` or `"-nattoppet::xxx-"` in files to indicate variable.

Avalables are:

    Template.post.layout.dir - 帖子的模板jade文件地址
