const path = require('path')
const fs = require('mz/fs')
const cp = require('mz/child_process')
const co = require('co')
const jade = require('jade')
const sass = require('node-sass')
const coffee = require('coffee-script')
const md = require('jstransformer-marked')

const compile = file => {
    const head = `extends ${path.relative(path.dirname(file), path.join(__dirname, '..', 'templates', 'bundle', 'bundle.jade'))}\n\n`
    return jade.compile(head + fs.readFileSync(file, 'utf8'), {filename: file})({require: include})
}

const include = file => {
    file = file.replace("@nattoppet", path.join(__dirname, '..', 'templates', 'bundle'))
    switch (suffix = path.extname(file).slice(1).toLowerCase()) {
        case 'jade':
            return jade.renderFile(file, {require: include})
        case 'less':
            return sass.renderSync({file: file, outputStyle: 'compressed'}).css
        case 'coffee':
            return coffee.compile(fs.readFileSync(file, 'utf8'))
        case 'md':
            return md.render(fs.readFileSync(file, 'utf8'))
        case 'png':
        case 'jpg':
        case 'jpeg':
            return `data:image/${suffix};base64,` + fs.readFileSync(file, 'base64')
        default:
            return fs.readFileSync(file, 'utf8')
    }
}

module.exports = co.wrap(function*(file, opt){
    const html = compile(file)
    const dest = path.join(path.dirname(file), path.parse(file).name+'.html')
    yield fs.writeFile(dest, html)
    console.info('生成完毕～')
})
