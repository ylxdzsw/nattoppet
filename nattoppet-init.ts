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
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Build
        run: deno run -A --unstable https://raw.githubusercontent.com/ylxdzsw/nattoppet/master/nattoppet.ts main.ymd > index.html

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4.4.1
        with:
          branch: gh-pages
          folder: "."
`)
}

console.info("Finished")
