const type = Deno.args[0]

const avaliable_templates = ["form"]

if (Deno.args.length != 1 || !avaliable_templates.includes(type)) {
    console.log("Usage: nattoppet-init form")
    Deno.exit(0)
}

Deno.writeTextFileSync("main.ymd", `\
[mixin] ${type}

[title]: Page Title

[h3] Section Header
[text].first_name First Name
[text](placeholder="LastName").last_name Last Name
[number].age Age

[checkbox].male Male
[checkbox].female Female

[require](main.js)
`)

Deno.writeTextFileSync("main.js", `\
async function run(args) {
    return JSON.stringify(args)
}

if (typeof Deno != 'undefined')
    run({}).then(console.log)
`)

const gen_wasm = prompt("Generate wasm? (give lib name or empty to cancel): ")

if (gen_wasm) {
    Deno.writeTextFileSync(`${gen_wasm}.rs`, `\
#[no_mangle]
pub unsafe extern fn sum(data: *const u32, len: usize) -> u32 {
    let mut sum = 0;
    for i in 0..len {
        sum += *data.add(i);
    }
    sum
}

#[no_mangle]
pub unsafe extern "C" fn alloc_memory(byte_size: usize, alignment: usize) -> *mut u8 {
    let layout = std::alloc::Layout::from_size_align_unchecked(byte_size, alignment);
    std::alloc::alloc(layout)
}

#[no_mangle]
pub unsafe extern "C" fn free_memory(ptr: *mut u8, byte_size: usize, alignment: usize) {
    let layout = std::alloc::Layout::from_size_align_unchecked(byte_size, alignment);
    std::alloc::dealloc(ptr, layout)
}
`)

    Deno.writeTextFileSync("Cargo.toml", `\
[package]
name = "${gen_wasm}"
version = "0.1.0"
authors = ["Shiwei Zhang <ylxdzsw@gmail.com>"]
edition = "2024"

[lib]
crate-type = ["cdylib"]
path = "${gen_wasm}.rs"

[profile.release]
codegen-units = 1
lto = true
strip = true

[dependencies]
absurd = { git = "https://github.com/ylxdzsw/absurd" }
`)

    Deno.writeTextFileSync("main.js", `

async function call_wasm() {
    await window.wasm_ready
    const buffer_ptr = ${gen_wasm}.alloc_memory(4 * 8, 4)
    const buffer_view = new Uint32Array(${gen_wasm}.memory.buffer, buffer_ptr, 8)
    buffer_view.set([1, 2, 3, 4, 5, 6, 7, 8])
    const sum = ${gen_wasm}.sum(buffer_ptr, 8)
    ${gen_wasm}.free_memory(buffer_ptr, 4 * 8, 4)
    console.log(sum)
}
`, { append: true, create: false })

    Deno.writeTextFileSync("main.ymd", `
[require](target/wasm32-unknown-unknown/release/${gen_wasm}.wasm)
`, { append: true, create: false })
}


const gen_workflow = prompt("Generate github workflow? (y/n): ")

if (gen_workflow == "y") {
    Deno.mkdirSync(".github")
    Deno.mkdirSync(".github/workflows")
    Deno.writeTextFileSync(".github/workflows/pages.yml", `\
name: Build and deploy to pages
on: [push]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
${gen_wasm ? `
      - name: Install Rust
        uses: dtolnay/rust-toolchain@nightly
        with:
          targets: wasm32-unknown-unknown

      - name: Compile WASM
        run: cargo build --release --target wasm32-unknown-unknown
` : ''}
      - name: Build HTML
        run: deno run -A https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts main.ymd > index.html

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: "."
`)
}

console.info("Finished")
