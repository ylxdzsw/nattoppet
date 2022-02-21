import * as path from "https://deno.land/std@0.126.0/path/mod.ts"

const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

const init = () => {
    Deno.mkdirSync('native')
    Deno.mkdirSync('native/src')
    Deno.mkdirSync('native/target')
    Deno.copyFileSync(path.join(__dirname, 'native', 'src', 'main.rs'), 'native/src/main.rs')
    Deno.copyFileSync(path.join(__dirname, 'native', 'build.rs'), 'native/build.rs')
    Deno.copyFileSync(path.join(__dirname, 'native', 'Cargo.toml'), 'native/Cargo.toml')
}

const bundle = async () => {
    const child = Deno.run({
        cmd: [
            Deno.execPath(),
            "run",
            "-A",
            "--unstable",
            path.join(__dirname, '/nattoppet.ts'),
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
