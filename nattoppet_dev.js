#!/usr/bin/env node

'use strict'

const file = process.argv[2]

if (process.argv.length != 3 || file == "--help")
    return console.log("Usage: nattoppet-dev file.{koa,ppt,vue,tml}.ymd")

const fs = require('fs')
const cp = require('child_process')
const http = require('http')

let content = "nattoppet start watching..."
let busy = 0
let queued = false
let lastevent = Date.now()

const done = () => {
    busy = (busy + 1) % 3
    !busy && queued && start(queued = false)
}

const start = () => {
    const child = cp.spawn('nattoppet', [file])
    let buffer = ''
    child.stdout.on('data', chunk => buffer += chunk)
    child.on('close', code => {
        if (code == 0) {
            console.log("updated")
            content = buffer
        } else
            console.error("failed") // todo: print time
        done()
    })
    setTimeout(done, 500)
    busy++
}

fs.watch(file).addListener("change", () => {
    if (Date.now() - lastevent < 50) return // hard throttle, not even queue it
    lastevent = Date.now()
    if (busy) return queued = true // soft throttle, queue at most one task
    start()
})

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(content)
}).listen(3939)

const browser = process.env.BROWSER || ({ darwin: 'open', win32: 'start', win64: 'start' })[process.platform] || 'xdg-open'

browser.includes('chrom')
    ? cp.exec(`${browser} --app=http://127.0.0.1:3939`)
    : cp.exec(`${browser} http://127.0.0.1:3939`)
