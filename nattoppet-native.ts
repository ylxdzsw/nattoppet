const main_source = `\
#![windows_subsystem = "windows"]

use web_view::*;

fn main() {
    static HTML_CONTENT: &str = include_str!("../target/bundle.html");

    web_view::builder()
        .title("Nattoppet Native")
        .content(Content::Html(HTML_CONTENT))
        .size(600, 480)
        .resizable(false)
        .debug(cfg!(debug_assertions))
        .user_data(())
        .invoke_handler(handler)
        .run()
        .unwrap();
}

fn handler(webview: &mut WebView<()>, arg: &str) -> WVResult {
    Ok(())
}
`

const build_source = `\
#[cfg(windows)]
extern crate winres;

#[cfg(windows)]
fn main() {
    let mut res = winres::WindowsResource::new();
    res.set_icon("../icon.ico");
    res.compile().unwrap();
}

#[cfg(not(windows))]
fn main() {}
`

const cargo_source = `\
[package]
name = "nattoppet_native"
version = "0.1.0"
edition = "2021"

[dependencies]
web-view = { version = "0.7", features = ["edge"] }

[target.'cfg(windows)'.build-dependencies]
winres = "0.1"

[package.metadata.winres]
ProductName = "A nattoppet native app"
`

const init = () => {
    Deno.mkdirSync('native')
    Deno.mkdirSync('native/src')
    Deno.mkdirSync('native/target')
    Deno.writeTextFileSync("native/src/main.rs", main_source)
    Deno.writeTextFileSync("native/build.rs", build_source)
    Deno.writeTextFileSync("native/Cargo.toml", cargo_source)
}

const bundle = async () => {
    const child = Deno.run({
        cmd: [
            Deno.execPath(),
            "run",
            "-A",
            "--no-check",
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
