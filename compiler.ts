const pattern = /^(?:\[(.+?)\]([:=])|\[mixin\] (.+?)\n)/m

const tokenize = (str: string, rpath = (x: any) => x) => {
    const tokens: any[] = []

    while (true) {
        const m = str.match(pattern)
        if (!m || m.index == null) {
            if (str) tokens.push({ type: 'text', content: str })
            break
        }

        if (m.index && m.index > 0) {
            tokens.push({ type: 'text', content: str.substring(0, m.index) })
        }

        if (m[3]) {
            tokens.push({ type: 'mixin', path: m[3] })
            str = str.substring(m.index + m[0].length)
            continue
        }

        const name = m[1]
        const type = m[2] == ':' ? 'ref' : 'fn'
        str = str.substring(m.index + m[0].length)

        const p1 = str.indexOf('\n\n')
        const p2 = str.search(pattern)
        const p = p1 >= 0 && p2 >= 0 ? Math.min(p1+1, p2) :
                  p1 < 0 && p2 < 0 ? str.length : Math.max(p1+1, p2)

        const content = str.substring(0, p).trim()
        str = str.substring(p)

        tokens.push({ type, name, content })
    }

    for (let i = 0; i < tokens.length; i++) if (tokens[i].type == 'mixin') {
        const path = rpath(tokens[i].path)
        const stat = Deno.statSync(path)
        if (stat.isDirectory) { // include before and after
            const before = tokenize(Deno.readTextFileSync(path + '/before.ymd'), rpath)
            const after = tokenize(Deno.readTextFileSync(path + '/after.ymd'), rpath)
            tokens.splice(i, 1, ...before)
            tokens.push(...after)
        } else {
            const mixins = tokenize(Deno.readTextFileSync(path), rpath)
            tokens.splice(i, 1, ...mixins)
        }
        i -= 1 // revisit i since we replaced it
    }

    return tokens
}

const _interpret = (str: string, env: any, defs: any[]): any => {
    const p1 = str.search(/^  /m)
    const p2 = str.search(/\[(.+?)\]/)
    if (p1 < 0 && p2 < 0) return str

    if (p2 < 0 || (p1 >= 0 && p1 < p2)) {
        const head = str.substring(0, p1)
        str = str.substring(p1+2)
        let p = str.indexOf('\n\n')
        if (p < 0) p = str.length
        return head + '<p>' + _interpret(str.substring(0, p), env, defs) + '</p>' + _interpret(str.substring(p+1), env, defs)
    }

    const name = str.match(/\[(.+?)\]/)![1]
    const i = defs.findIndex(x => x.name == name)
    if (i < 0) throw `definition ${name} not found`

    const def = defs[i]
    switch (def.type) {
        case 'fn':
            env.remaining = str.substring(p2 + name.length + 2)
            env.interpret = (str: string) => { // a "scoped" interpret function capable for interpreting substrings. We preserve the "remaining" property outside.
                const remaining = env.remaining
                const result = _interpret(str, env, defs) // We gaved full defs available on the call site (dynamic scoping) as the text to be interpreted is part of the call site text.
                env.remaining = remaining
                return result
            }
            // const result = vm.runInContext('{' + def.content + '}', env)
            for (const k in env) {
                if (env.hasOwnProperty(k))
                    // @ts-ignore
                    globalThis[k] = env[k]
            }
            const result = (1, eval)('{' + def.content + '}')
            return str.substring(0, p2) + result + _interpret(env.remaining, env, defs)
        case 'ref':
            return str.substring(0, p2) +
                _interpret(def.content, env, defs.slice(i+1)) + // However for ref we use lexical scoping. Exclude self to prevent recusion
                _interpret(str.substring(p2 + name.length + 2), env, defs)
        default: throw 'unknown defs type'
    }
}

export const compile = (str: string, locals: any = {}) => {
    // const env = vm.createContext(locals)
    const env: any = locals
    for (const k in env) if (typeof(env[k]) == 'function')
        env[k] = env[k].bind(env)

    let tokens = tokenize(str, env.rpath)
    let output = ''
    while (true) {
        const token = tokens.shift()
        if (!token) return output
        if (token.type == 'text') {
            output += _interpret(token.content, env, tokens)
        }
    }
}

/*
TODO:
1. support first-class markdown-like nestable lists
2. cleanup the spaces, carefully define when to trim
3. require a newline before indent to open paragraph?
4. provide relative path resolution inside mixins
*/
