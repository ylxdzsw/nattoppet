import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const file = process.argv[2]

if (process.argv.length < 3 || file == "--help") {
    console.log("Usage: nattoppet-dev [file] [hook cmd]...")
    process.exit(0)
}

const nattoppetPath = fileURLToPath(new URL("nattoppet.ts", import.meta.url))

Bun.serve({
    port: 3939,
    async fetch(request) {
        const url = new URL(request.url)
        
        // Static file serving
        if (url.pathname !== '/') {
            try {
                const filePath = path.join(process.cwd(), url.pathname)
                const file = Bun.file(filePath)
                if (await file.exists()) {
                    return new Response(file)
                }
            } catch (e) {
                if (url.pathname !== "/favicon.ico") {
                    console.error(e)
                }
            }
            return new Response("Not found", { status: 404 })
        }
        
        // Run build hooks if specified
        if (process.argv.length > 3) {
            const hookProc = Bun.spawn(process.argv.slice(3))
            const exitCode = await hookProc.exited
            
            if (exitCode !== 0) {
                console.warn("!!! hook command exit with non-0 status")
                return new Response("Hook command failed", { status: 500 })
            }
        }
        
        // Compile the nattoppet file
        const compileProc = Bun.spawn([
            process.execPath,
            "run",
            nattoppetPath,
            file,
            "--dev"
        ], {
            stdout: 'pipe',
            stderr: 'pipe'
        })
        
        const [stdout, stderr] = await Promise.all([
            new Response(compileProc.stdout).arrayBuffer(),
            new Response(compileProc.stderr).text()
        ])
        
        const exitCode = await compileProc.exited
        
        if (stderr) {
            console.error(stderr)
        }
        
        const content = exitCode === 0 ? new Uint8Array(stdout) : new TextEncoder().encode("Compilation failed")
        
        return new Response(content, {
            headers: {
                "Content-Type": "text/html"
            },
            status: 200
        })
    }
})

console.log("Server running at http://127.0.0.1:3939")

// Open browser
const platform = process.platform
const browser = process.env.BROWSER ?? (
    platform === 'darwin' ? 'open' :
    platform === 'win32' ? 'start' :
    'xdg-open'
)

const browserCmd = browser.includes('chrom')
    ? [browser, "--app=http://127.0.0.1:3939"]
    : [browser, "http://127.0.0.1:3939"]

Bun.spawn(browserCmd, { 
    stdio: ['ignore', 'ignore', 'ignore']
})
