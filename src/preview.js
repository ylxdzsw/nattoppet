'use strict'

const spawn = require('child_process').spawn

module.exports = function(){
    const server = spawn('python', "-m http.server 8000".split(' '),
        {cwd: require('path').resolve('blog')})
    server.stderr.on('data', data => console.log(''+ data))
    server.stdout.on('data', data => console.log(''+ data))
    setTimeout(()=>require('openurl').open("http://localhost:8000"), 2000)
    server.on('close', code => console.log("exit with code:"+code))
    console.log('访问localhost:8000开始预览，使用Ctrl-C关闭')
}
