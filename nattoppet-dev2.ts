const file = Deno.args[0]

if (Deno.args.length != 1 || file == "--help") {
    console.log("Usage: nattoppet-dev2 [file]")
    Deno.exit(0)
}

;(async () => {
    const server = Deno.listen({ port: 3939 })
    for await (const conn of server) {
        ;(async () => {
            const httpConn = Deno.serveHttp(conn)
            for await (const { respondWith, request: { url } } of httpConn) {
                if (new URL(url).pathname != '/') {
                    respondWith(new Response(undefined, { status: 404 })).catch(e => console.error(e))
                    continue
                }

                const child = Deno.run({
                    cmd: [
                        Deno.execPath(),
                        "run",
                        "-A",
                        "--unstable",
                        "--no-check",
                        new URL("nattoppet.ts", import.meta.url).href,
                        file,
                        "--dev"
                    ],
                    stdout: "piped"
                })

                const output = await child.output()
                const status = await child.status()

                const content = status.code == 0 ? output : "failed"

                respondWith(new Response(content, {
                    headers: {
                        "Content-Type": "text/html"
                    },
                    status: 200
                })).catch(e => console.error(e))
            }
        })()
    }
})()

const browser = Deno.env.get("BROWSER") ?? ({ darwin: 'open', windows: 'start', linux: 'xdg-open' })[Deno.build.os] ?? 'xdg-open'

browser.includes('chrom')
    ? Deno.run({ cmd: [browser, "--app=http://127.0.0.1:3939"] })
    : Deno.run({ cmd: [browser, "http://127.0.0.1:3939"] })
