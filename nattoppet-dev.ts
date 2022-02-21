import * as path from "https://deno.land/std@0.126.0/path/mod.ts"

const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

const file = Deno.args[0]

if (Deno.args.length != 1 || file == "--help") {
    console.log("Usage: nattoppet-dev [file]")
    Deno.exit(0)
}

let content = new TextEncoder().encode("start watching...")
let busy = 0
let queued = false
let lastevent = Date.now()

const done = () => {
    busy = (busy + 1) % 3
    !busy && queued && start(queued = false)
}

const start = async (init=false) => {
    const child = Deno.run({
        cmd: [
            Deno.execPath(),
            "run",
            "-A",
            "--unstable",
            path.join(__dirname, '/nattoppet.ts'),
            file,
            "--dev"
        ],
        stdout: "piped"
    })

    setTimeout(done, 500)
    busy++

    const output = await child.output()
    const status = await child.status()

    if (status.code == 0) {
        console.log(init ? "rendered" : "updated")
        content = output
    } else {
        console.error("failed") // todo: print time
    }
    done()
}

;(async () => {
    const watcher = Deno.watchFs(file)
    for await (const e of watcher) {
        if (e.kind != "modify") continue
        if (Date.now() - lastevent < 50) continue // hard throttle, not even queue it
        lastevent = Date.now()
        if (busy) { // soft throttle, queue at most one task
            queued = true
            continue
        }
        start()
    }
})()

;(async () => {
    const server = Deno.listen({ port: 3939 })
    for await (const conn of server) {
        ;(async () => {
            const httpConn = Deno.serveHttp(conn)
            for await (const { respondWith } of httpConn) {
                respondWith(new Response(content, {
                    headers: {
                        "Content-Type": "text/html"
                    },
                    status: 200
                }))
            }
        })()
    }
})()

const browser = Deno.env.get("BROWSER") ?? ({ darwin: 'open', windows: 'start', linux: 'xdg-open' })[Deno.build.os] ?? 'xdg-open'

browser.includes('chrom')
    ? Deno.run({ cmd: [browser, "--app=http://127.0.0.1:3939"] })
    : Deno.run({ cmd: [browser, "http://127.0.0.1:3939"] })

start(true)
