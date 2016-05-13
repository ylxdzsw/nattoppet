Nattoppet
=========

A tiny static blog generator for [my own blog](http://blog.ylxdzsw.com)

#### 开发环境

- Windows 10 64bit
- node.js 5.7.1

#### 使用方法

```
$ npm install -g nattoppet
$ nattoppet build
```

for more information about nattoppet CLI util, use `nattoppet --help`

#### 目录结构

"A post" means a folder that contains `post.json`. Posts can be placed on directories that are not posts.

`post.json` contains following fields:

```
{
    "title": "Hello World!",             // the title
    "date": "2015-12-17",                // the date
    "entry": "main",                     // entry html file without suffix
    "label": ["lifestyle"],              // keywords of this post
    "discription": "hello world!",       // Optional: discription for this post
    "cover": "me.jpg",                   // Optional: cover image for this post
    "no-compile": ["something.coffee"],  // Optional: files that shouldn't compile
    "no-copy": ["something.md"]          // Optional: files that shouldn't copy to final site
}
```

#### 模板变量

Use `nattoppet::xxx` or `"-nattoppet::xxx-"` in files to indicate variable.

Avalables are:

    Post.layout.dir - 帖子的模板jade文件地址
    Theme.koa.dir - koa主题的模板地址
    Theme.vue.dir - vue主题的模板地址
