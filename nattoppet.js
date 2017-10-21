#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const transformer = require('jstransformer')

const pug    = transformer(require('jstransformer-pug'))
const coffee = transformer(require('jstransformer-coffee-script'))
const less   = transformer(require('jstransformer-less'))
const sass   = transformer(require('jstransformer-sass'))
const marked = transformer(require('jstransformer-marked'))
const minify = transformer(require('jstransformer-html-minifier'))
const uglify = transformer(require('jstransformer-uglify-js'))

const compile = file => {
    const suffix = path.extname(file).slice(1).toLowerCase()
    const _require = y => compile(y.startsWith('/') ? y : path.join(path.dirname(file), y))
    const content = () => fs.readFileSync(file, 'utf8').replace(/@nattoppet/g, path.join(__dirname, 'assets'))

    switch (suffix) {
        case 'pug':
        case 'jade':
            const x = pug.render(content(), {filename: file, basedir: '/'}, {require: _require}).body
            return minify.render(x, { removeAttributeQuotes:true, removeComments:true }).body
        case 'sass':
        case 'scss':
            return sass.render(content(), {outputStyle: 'compressed'}).body
        case 'less':
            return less.render(content(), {compress: true}).body
        case 'coffee':
            return uglify.render(coffee.render(content()).body).body
        case 'markdown':
        case 'md':
            return marked.render(content()).body
        case 'png':
        case 'jpg':
        case 'gif':
        case 'jpeg':
            return `data:image/${suffix};base64,` + fs.readFileSync(file, 'base64')
        default:
            return content()
    }
}

const posts = []

const post = x => {
    x = x.split(path.sep)
    x = x[x.length-1]
    posts.push(x)
    return x
}

const walk = dir => {
    const list = fs.readdirSync(dir).sort()

    for (let item of list) {
        const stat = fs.statSync(path.join(dir, item))

        if (stat.isFile()) {
            if (item == "main.jade" || item == "main.html") {
                name = post(dir)
                fs.writeFileSync(name + '.html', compile(path.join(dir, item)))
                break
            } else if (item == "main.pdf") {
                name = post(dir)
                fs.copyFileSync(path.join(dir, item), name + '.pdf')
            } else if (item == "main.tex") {
                for (let postfix of ["aux", "fdb_latexmk", "fls", "log", "pdf", "synctex.gz", "bbl", "idx"]) {
                    fs.unlink(path.join(dir, "main." + postfix), e=>0)
                }
            }
        } else if (stat.isDirectory()) {
            walk(path.join(dir, item))
        }
    }
}

const opt = process.argv[2]

if (process.argv.length != 3 || opt == "--help") {
    return console.log(`
nattoppet: A tiny HTML bundler and static blog generator.

  nattoppet file > file.html

Compile file with a special function "require" which you can use inside the jade file. Required file will be \
bundle into the compiled HTML file directly, with coffee/sass compiled and minified and images base64 encoded.

  nattoppet folder

Find all "main.jade" insides folder recursively and compile all them. The output HTML's names are the direct \
folder names. If there being an "index.jade" under the folder, it will be compiled with a variable "posts" witch \
contains all compiled file names.

Outputs will be placed into current work directory
`)}

if (!fs.existsSync(opt)) {
    return console.error("file or folder not exists")
}

const stat = fs.statSync(opt)

if (stat.isFile()) {
    process.stdout.write(compile(opt))
} else if (stat.isDirectory()) {
    walk(opt)
    let index = path.join(opt, "index.jade")
    let msg = ''
    if (fs.existsSync(index)) {
        index = pug.renderFile(index, {filename: index, basedir: '/'}, {posts: posts}).body
        index = minify.render(index, { removeAttributeQuotes:true, removeComments:true }).body
        fs.writeFileSync("index.html", index)
        msg = "and an index"
    }
    console.info(`build finished, ${posts.length} bundles ${msg} generated`)
} else {
    console.error(`ERROR: $opt should be a text file or a folder`)
}

