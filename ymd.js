const minify = require('html-minifier').minify

function render_files(env, ...files) {
    const str = files.map(x=>fs.readFileSync(x, 'utf8')).reduce((x, y) => x + '\n\n' + y)
    return ymd.render(str, env)
}

const rpath = (...x) => path.join(__dirname, ...x)

const render = file => {
    const seg = path.basename(file).split('.')
    const theme = seg[seg.length-2]
    const base_dir = path.dirname(path.resolve(file))
    const env = {base_dir, ...helpers}
    const html = ['koa', 'ppt', 'vue', 'tml'].includes(theme)
        ? render_files(env, rpath(theme, 'before.ymd'), file, rpath(theme, 'after.ymd'), rpath('nattoppet.ymd'))
        : render_files(env, file, rpath('nattoppet.ymd'))
    return minify(html, {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeOptionalTags: true,
        minifyCSS: true,
        minifyJS: true,
    })
}

// TODO: if no file path provided, read stdin and use pwd as base_dir
const file = process.argv[2]

if (process.argv.length != 3 || file == "--help")
    return console.log("Usage: nattoppet file.{koa,ppt,vue,tml}.ymd > file.html")

process.stdout.write(render(file))
