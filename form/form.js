function gather_inputs() {
    const args = Object.create(null)

    for (const e of document.querySelectorAll('input')) {
        switch (e.type) {
            case 'text':
                args[e.name] = e.value
                break;
            case 'number':
                args[e.name] = parseFloat(e.value)
                break;
            case 'checkbox':
                args[e.name] = e.checked
                break;
        }
    }

    return args
}

window.addEventListener('load', async () => {
    document.querySelector('button').addEventListener('click', async () => {
        document.querySelector('pre').classList.remove('hidden')
        document.querySelector('button').disabled = true
        await new Promise(res => setTimeout(res, 0))

        const args = gather_inputs()

        try {
            const result = await run(args)
            if (result)
                document.querySelector('pre').textContent = result
        } catch (e) {
            document.querySelector('pre').textContent = "Error: " + (e.message ?? e)
            throw e
        } finally {
            document.querySelector('button').disabled = false
            await new Promise(res => setTimeout(res, 0))
        }
    })

    document.body.addEventListener('input', () => {
        const url_params = new URLSearchParams(gather_inputs())
        history.replaceState(null, '', '#' + url_params.toString())
    })

    if (location.hash.length > 1) {
        const url_params = new URLSearchParams(location.hash.slice(1))
        for (const [name, value] of url_params.entries()) {
            const e = document.querySelector(`input[name="${name}"]`)
            if (!e) continue

            switch (e.type) {
                case 'text':
                case 'number':
                    e.value = value
                    break;
                case 'checkbox':
                    e.checked = value == 'true'
                    break;
            }
        }
    }
})
