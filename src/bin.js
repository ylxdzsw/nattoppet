#!/usr/bin/env node

var program = require('commander')

program.version('0.0.1')
    .option('-d, --dir <path>', 'specify blog dir') // TODO
    .option('-r, --repo <url>', 'specify github page repo') //TODO

program.command('clean')
    .description('clean work space')
    .action(function(opt){
        throw 'TODO'
    })

program.command('build')
    .description('build your site')
    .action(function(opt){
        throw 'TODO'
    })

program.command('deploy')
    .description('publish to github page')
    .action(function(opt){
        throw 'TODO'
    })

program.parse()
