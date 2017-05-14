#!/usr/bin/env node
'use strict'

const Command = require('commander').Command
const program = new Command('nattoppet')
const co = require('co')

const util = require('./util.js')

program.version('0.4.1')
    .option('-d, --dir <path>', 'specify output dir')
    .option('-r, --repo <url>', 'specify github page repo') //TODO

program.command('clean')
    .description('clean work space')
    .action(require('./clean.js'))

program.command('build')
    .description('build your site')
    .action(require('./build.js'))

program.command('preview')
    .description('take a look locally')
    .action(require('./preview.js'))

program.command('deploy')
    .description('publish to github page')
    .action(require('./deploy.js'))

program.command('bundle <file>')
    .description('make single html bundle')
    .action(require('./bundle.js'))

program.command('auto')
    .description('clean, build and preview')
    .action(co.wrap(function*(opt){
        yield require('./clean.js')(opt)
        yield require('./build.js')(opt)
        yield require('./preview.js')(opt)
    }))

program.parse(process.argv)

if (process.argv.length <= 2) {
    program.outputHelp()
}
