const file = Deno.args[0]

if (Deno.args.length < 1 || file == "--help") {
    console.log("Usage: nattoppet-dev2 [file] [hook cmd]...")
    Deno.exit(0)
}

;(async () => {
    const server = Deno.listen({ port: 3939 })
    for await (const conn of server) (async () => {
        const httpConn = Deno.serveHttp(conn)
        for await (const { respondWith, request: { url } } of httpConn) (async () => {
            if (new URL(url).pathname != '/') {
                try {
                    const file = await Deno.open(new URL(url).pathname.slice(1), { read: true })
                    await respondWith(new Response(file.readable, {
                        status: 200
                    }))
                } catch (e) {
                    if (new URL(url).pathname == "/favicon.ico")
                        return
                    console.error(e)
                }

                return
            }

            if (Deno.args.length > 1) {
                // TODO: lock? currently I only run cargo which has its own lock.
                const status = await Deno.run({
                    cmd: Deno.args.slice(1)
                }).status()

                if (status.code != 0) {
                    console.warn("!!! hook command exit with non-0 status")
                    return
                }
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

            await respondWith(new Response(content, {
                headers: {
                    "Content-Type": "text/html"
                },
                status: 200
            }))
        })().catch(e => console.error(e))
    })().catch(e => console.error(e))
})().catch(e => console.error(e))

const browser = Deno.env.get("BROWSER") ?? ({ darwin: 'open', windows: 'start', linux: 'xdg-open' })[Deno.build.os] ?? 'xdg-open'

browser.includes('chrom')
    ? Deno.run({ cmd: [browser, "--app=http://127.0.0.1:3939"] })
    : Deno.run({ cmd: [browser, "http://127.0.0.1:3939"] })
