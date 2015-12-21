Nattoppet
=========

A tiny static blog generator for [my own blog](http://www.ylxdzsw.com)

#### 测试环境

- Windows 7 32bit with sp1
- node.js 5.3.0

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
    "no-copy": ["something.md"]          // Optional: files that shouldn't copy to _site
}
```

#### 模板变量

Use `nattoppet::xxx` or `"-nattoppet::xxx-"` in files to indicate variable.

Avalables are:

    Template.post.layout.dir - 帖子的模板jade文件地址
    Package.version - package.json的version字段的值

#### 代码风格

1. 除了立即执行函数等个别情况，一律不写分号
2. 除了for循环和某些迭代式算法等个别情况，全部使用const，上述情况使用let，永不使用var
3. 使用forEach来遍历数组
4. 仅在map，reduce等操作时使用Arrow Function，其它时候都使用function关键字，使用闭包来保存this指针的值
5. 一律使用'use strict'
6. 使用`Object.create(null)`而不是`new Map`，使用`for in`来遍历
7. catch所有Promise，即使它不会有异常
8. 对象和数组的字面量都不加末尾的多余逗号
