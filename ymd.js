#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const stdlib = require('./stdlib')
const compiler = require('./compiler')
const minifier = require('html-minifier')

const file = process.argv[2] || 0
const dir = file ? path.dirname(path.resolve(file)) : process.cwd()
const str = fs.readFileSync(file, 'utf8')
const env = { ...stdlib, base_dir: dir }
const out = minifier.minify(compiler.compile(str, env), {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: true,
})

process.stdout.write(out)
