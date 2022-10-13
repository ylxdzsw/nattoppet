window.addEventListener('load', async () => {
    document.querySelector('button').addEventListener('click', async () => {
        document.querySelector('pre').classList.remove('hidden')
        document.querySelector('button').disabled = true

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

        try {
            const result = await run(args)
            if (result)
                document.querySelector('pre').textContent = result
        } catch (e) {
            document.querySelector('pre').textContent = "Error. Check the console."
            throw e
        } finally {
            document.querySelector('button').disabled = false
        }
    })
})
