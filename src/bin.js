#!/usr/bin/env node

var program = require('commander')

program.version('0.0.1')
    .option('-d, --dir <path>', 'specify blog dir') // TODO
    .option('-r, --repo <url>', 'specify github page repo') //TODO

program.command('clean')
    .description('clean work space')
    .action(require('./clean.js'))

program.command('build')
    .description('build your site')
    .action(require('./build.js'))

program.command('deploy')
    .description('publish to github page')
    .action(require('./deploy.js'))

program.parse(process.argv)

if (process.argv.length <= 2) {
    program.outputHelp()
}
