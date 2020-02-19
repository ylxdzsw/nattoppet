'use strict'

const vm = require("vm")

const def_pattern = /^\[(.+?)\]([:=])/m

const tokenize = str => {
    const tokens = []

    while (true) {
        if (!str) return tokens

        const m = str.match(def_pattern)
        if (!m) return [...tokens, { type: 'text', content: str }]

        if (m.index > 0) {
            tokens.push({ type: 'text', content: str.substring(0, m.index) })
        }

        const name = m[1]
        const type = m[2] == ':' ? 'ref' : 'fn'
        str = str.substring(m.index + m[0].length)

        const p1 = str.indexOf('\n\n')
        const p2 = str.search(def_pattern)
        const p = p1 >= 0 && p2 >= 0 ? Math.min(p1+1, p2) :
                  p1 < 0 && p2 < 0 ? str.length : Math.max(p1+1, p2)

        const content = str.substring(0, p).trim()
        str = str.substring(p)

        tokens.push({ type, name, content })
    }
}

const interpret = (str, env, defs) => {
    const p1 = str.search(/^  /m)
    const p2 = str.search(/\[(.+?)\]/)
    if (p1 < 0 && p2 < 0) return str

    if (p2 < 0 || (p1 >= 0 && p1 < p2)) {
        let p = str.indexOf('\n\n')
        if (p < 0) p = str.length
        return str.substring(0, p1) + '<p>' + interpret(str.substring(p1+2, p), env, defs) + '</p>' + interpret(str.substring(p+1), env, defs)
    }

    const name = str.match(/\[(.+?)\]/)[1]
    const i = defs.find(x => x.name == name)
    if (i < 0) throw `definition ${name} not found`

    const def = defs[i]
    switch (def.type) {
        case 'fn':
            env.remaining = str.substring(p2 + name.length + 2)
            env.interpret = str => interpret(str, env, defs) // we gaved full defs that on the call site (dynamic scoping) since it is likely to be used on text near the callsite (not text on the fn definition)
            return str.substring(0, p2) + vm.runInContext('{' + def.content + '}', env)
        case 'ref':
            return str.substring(0, p2) +
                interpret(def.content, env, defs.slice(i+1)) + // however for ref we use lexical scoping, exclude self to prevent recusion
                interpret(str.substring(p2 + name.length + 2), env, defs)
        default: throw 'unknown defs type'
    }
}

exports.compile = (str, locals={}) => {
    const env = vm.createContext({...helpers, ...locals})
    for (const k in env) if (typeof(env[k]) == 'function')
        env[k] = env[k].bind(env)

    let tokens = tokenize(str)
    let output = ''
    while (true) {
        const token = tokens.shift()
        if (!token) return output
        if (token.type == 'text') {
            output += interpret(token.content, env, tokens)
        }
    }
}

/*
TODO:
1. support first-class markdown-like nestable lists
2. cleanup the spaces, carefully define when to trim
*/
