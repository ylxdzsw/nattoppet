import vm from "node:vm"
import { extname } from "node:path"
import { fileURLToPath } from "node:url"
import * as fs from "node:fs"

const pattern = /^(?:\[(.+?)\]([:=])|\[(mixin|#slot)\] ?(.*?)\n)/m

const fetch_text_file = async (path: string) => {
    const filePath = new URL(path, import.meta.url)
    return fs.readFileSync(fileURLToPath(filePath), 'utf-8')
}

const file_exists = (path: string) => {
    try {
        const filePath = new URL(path, import.meta.url)
        fs.accessSync(fileURLToPath(filePath))
        return true
    } catch {
        return false
    }
}

const resolve_mixin_path = (path: string): string => {
    if (extname(path)) return path
    // Compatibility hack: bare name only resolves to .ymd if exact file doesn't exist
    if (file_exists(path)) return path
    const ymdPath = path + ".ymd"
    if (file_exists(ymdPath)) return ymdPath
    throw `mixin not found: ${path}`
}

// tokenize also process mixins
// mixins are special direvatives
// by default, they are relative to the root directory of nattoppet, unless they are prefixed with "./"
export const tokenize = async (str: string) => {
    const tokens: any[] = []

    while (true) {
        const m = str.match(pattern)
        if (!m || m.index == null) {
            if (str) tokens.push({ type: "code", content: str })
            break
        }

        if (m.index && m.index > 0) {
            tokens.push({ type: "code", content: str.substring(0, m.index) })
        }

        if (m[3]) {
            if (m[3] === 'mixin') {
                tokens.push({ type: 'mixin', path: m[4] })
            } else if (m[3] === '#slot') {
                tokens.push({ type: 'slot' })
            }
            str = str.substring(m.index + m[0].length)
            continue
        }

        const name = m[1]
        const type = m[2] == ':' ? 'ref' : 'fn'
        str = str.substring(m.index + m[0].length)

        const p1 = str.indexOf('\n\n')
        const p2 = str.search(pattern)
        const p = p1 >= 0 && p2 >= 0 ? Math.min(p1+2, p2) :
                  p1 < 0 && p2 < 0 ? str.length : Math.max(p1+2, p2)

        const content = str.substring(0, p).trim()
        str = str.substring(p)

        tokens.push({ type, name, content })
    }

    for (let i = 0; i < tokens.length; i++) if (tokens[i].type == 'mixin') {
        const resolvedPath = resolve_mixin_path(tokens[i].path)
        const ext = extname(resolvedPath)

        if (ext === ".ymd") {
            const text = await fetch_text_file(resolvedPath)
            const inlineTokens = await tokenize(text)
            const slotIndices = inlineTokens
                .map((t: any, idx: number) => t.type === 'slot' ? idx : -1)
                .filter((idx: number) => idx >= 0)

            if (slotIndices.length > 1) {
                throw `multiple [#slot] in mixin ${resolvedPath}`
            } else if (slotIndices.length === 1) {
                const slotIdx = slotIndices[0]
                const head = inlineTokens.slice(0, slotIdx)
                const tail = inlineTokens.slice(slotIdx + 1)
                tokens.splice(i, 1, ...head)
                tokens.push(...tail)
            } else {
                tokens.splice(i, 1, ...inlineTokens)
            }
        } else {
            tokens[i] = { type: "raw", content: await fetch_text_file(resolvedPath) }
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
        return head + '<p>' + _interpret(str.substring(0, p), env, defs) + '</p>' + _interpret(str.substring(p+2), env, defs)
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
            const result = vm.runInContext('{' + def.content + '}', env)
            return str.substring(0, p2) + result + _interpret(env.remaining, env, defs)
        case 'ref':
            return str.substring(0, p2) +
                _interpret(def.content, env, defs.slice(i+1)) + // Exclude self from scope to prevent infinite recursion, but allow forward references
                _interpret(str.substring(p2 + name.length + 2), env, defs)
        default: throw 'unknown defs type'
    }
}

export const compile = async (str: string, locals: any = {}) => {
    const env = vm.createContext(locals)
    for (const k in env) if (typeof(env[k]) == 'function')
        env[k] = env[k].bind(env)

    let tokens = await tokenize(str)
    let output = ''
    while (true) {
        const token = tokens.shift()
        if (!token) return output
        switch (token.type) {
            case "code":
                output += _interpret(token.content, env, tokens)
                break
            case "raw":
                output += token.content
                break
        }
    }
}

/*
TODO:
1. support first-class markdown-like nestable lists
2. cleanup the spaces, carefully define when to trim
3. require a newline before indent to open paragraph?
*/
