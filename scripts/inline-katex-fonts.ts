import * as fs from "node:fs"
import * as path from "node:path"

const katexDir = path.resolve("node_modules/katex/dist")
const cssPath = path.join(katexDir, "katex.min.css")
const fontsDir = path.join(katexDir, "fonts")
const outPath = path.resolve("katex.css")

let css = fs.readFileSync(cssPath, "utf-8")

// Replace multi-format src with a single inlined woff2 data URI.
// Matches: url(fonts/Filename.woff2) format("woff2"),url(fonts/Filename.woff) format("woff"),url(fonts/Filename.ttf) format("truetype")
// We capture the woff2 filename, read it, base64 it, and replace the whole src value.
const srcRegex = /src:\s*url\(fonts\/([^)]+\.woff2)\)\s*format\("woff2"\)(?:,\s*url\(fonts\/[^)]+\)\s*format\("[^"]+"\))*/g

css = css.replace(srcRegex, (match, woff2File) => {
    const fontPath = path.join(fontsDir, woff2File)
    const data = fs.readFileSync(fontPath)
    const base64 = data.toString("base64")
    return `src:url(data:font/woff2;base64,${base64})`
})

fs.writeFileSync(outPath, css)
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`)
