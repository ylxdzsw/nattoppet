#!/usr/bin/env node

'use strict'

const fs = require('fs')
const cp = require('child_process')
const path = require('path')

const init = () => {
    fs.mkdirSync('native')
    fs.mkdirSync('native/src')
    fs.mkdirSync('native/target')
    fs.copyFileSync(path.join(__dirname, 'native', 'src', 'main.rs'), 'native/src/main.rs')
    fs.copyFileSync(path.join(__dirname, 'native', 'build.rs'), 'native/build.rs')
    fs.copyFileSync(path.join(__dirname, 'native', 'Cargo.toml'), 'native/Cargo.toml')
}

const bundle = () => {
    const child = cp.spawnSync(__dirname + '/nattoppet.js', [process.argv[3]])
    if (child.stderr.length) {
        console.error(child.stderr.toString())
    }
    fs.writeFileSync('native/target/bundle.html', child.stdout)
}

const build = () => {
    bundle()
    const child = cp.spawn('cargo', ['build', '--release'], { cwd: 'native' })
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('exit', (code) => {
        if (code != 0) {
            console.error("Cargo exit with code: " + code)
        } else {
            console.log("building finished. Check native/target/release/")
        }
    })
}

const help = () => {
    console.log("Usage: nattoppet-native [init|bundle|build]")
}

switch (process.argv[2]) {
    case 'init': return init()
    case 'bundle': return bundle()
    case 'build': return build()
    default: return help()
}
