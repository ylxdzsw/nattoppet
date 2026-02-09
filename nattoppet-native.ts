import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

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
    fs.mkdirSync('native', { recursive: true })
    fs.mkdirSync('native/src', { recursive: true })
    fs.mkdirSync('native/target', { recursive: true })
    fs.writeFileSync("native/src/main.rs", main_source)
    fs.writeFileSync("native/build.rs", build_source)
    fs.writeFileSync("native/Cargo.toml", cargo_source)
}

const bundle = async () => {
    const nattoppetPath = fileURLToPath(new URL("nattoppet.ts", import.meta.url))
    const proc = Bun.spawn([
        process.execPath,
        "run",
        nattoppetPath,
        process.argv[3]
    ], {
        stdout: 'pipe',
        stderr: 'pipe'
    })
    
    const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).arrayBuffer(),
        new Response(proc.stderr).text()
    ])
    
    if (stderr)
        console.error(stderr)
    
    fs.writeFileSync('native/target/bundle.html', new Uint8Array(stdout))
}

const build = async () => {
    await bundle()
    const proc = Bun.spawn(['cargo', 'build', '--release'], {
        cwd: 'native'
    })
    
    const exitCode = await proc.exited
    if (exitCode != 0) {
        console.error("Cargo exit with code: " + exitCode)
    } else {
        console.log("building finished. Check native/target/release/")
    }
}

const help = () => {
    console.log("Usage: nattoppet-native [init|bundle|build] <file.ymd>")
}

switch (process.argv[2]) {
    case 'init': init(); break
    case 'bundle': bundle(); break
    case 'build': build(); break
    default: help(); break
}
