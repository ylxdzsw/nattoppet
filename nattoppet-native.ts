const init = async () => {
    Deno.mkdirSync('native')
    Deno.mkdirSync('native/src')
    Deno.mkdirSync('native/target')
    Deno.writeTextFileSync("native/src/main.rs", await (await fetch(new URL("native/src/main.rs", import.meta.url))).text())
    Deno.writeTextFileSync("native/build.rs", await (await fetch(new URL("native/build.rs", import.meta.url))).text())
    Deno.writeTextFileSync("native/Cargo.toml", await (await fetch(new URL("native/Cargo.toml", import.meta.url))).text())
}

const bundle = async () => {
    const child = Deno.run({
        cmd: [
            Deno.execPath(),
            "run",
            "-A",
            "--unstable",
            new URL("nattoppet.ts", import.meta.url).href,
            Deno.args[1]
        ],
        stdout: "piped",
        stderr: "piped"
    })
    const [stdout, stderr] = await Promise.all([child.output(), child.stderrOutput()])
    if (stderr.length)
        console.error(new TextDecoder().decode(stderr))
    Deno.writeFileSync('native/target/bundle.html', stdout)
}

const build = async () => {
    await bundle()
    const child = Deno.run({
        cmd: ['cargo', 'build', '--release'],
        cwd: 'native'
    })
    const status = await child.status()
    if (status.code != 0) {
        console.error("Cargo exit with code: " + status.code)
    } else {
        console.log("building finished. Check native/target/release/")
    }
}

const help = () => {
    console.log("Usage: nattoppet-native [init|bundle|build] <file.ymd>")
}

switch (Deno.args[0]) {
    case 'init': init(); break
    case 'bundle': bundle(); break
    case 'build': build(); break
    default: help(); break
}
