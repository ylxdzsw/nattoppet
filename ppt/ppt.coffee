# events: click, delay, sim
# time-for-delay: short, long
# fx: slide, fade, fx-[color]
# time-for-fx: fast, slow

init = ->
    scens = [].slice.call document.querySelectorAll '.scen'
    current = scens[0]
    timeline = 0
    clickListener = ->

    enter = (x) ->
        x.classList.add 'active'
        fx ++timeline, [].slice.call x.querySelectorAll '.click, .delay, .sim'

    inview = (x) ->
        { top, height } = do x.getBoundingClientRect
        top <= innerHeight / 2 <= top + height

    update = ->
        if not inview current
            for x in scens
                if inview x
                    for e in document.querySelectorAll('.active')
                        e.classList.remove 'active'
                    enter x
                    current = x
                    break

    fx = (t, [head, tail...]) ->
        if not head?
            return

        cb = ->
            if t isnt timeline
                return
            head.classList.add 'active'
            fx t, tail

        if head.classList.contains 'click'
            clickListener = cb
        else if head.classList.contains 'delay'
            if head.classList.contains 'long'
                setTimeout cb, 800
            else if head.classList.contains 'short'
                setTimeout cb, 200
            else
                setTimeout cb, 400
        else if head.classList.contains 'sim'
            do cb

    enter current
    addEventListener 'click', -> do clickListener
    addEventListener 'scroll', update
    addEventListener 'resize', update
    setInterval update, 2000

if document.readyState == 'loading'
    document.addEventListener 'DOMContentLoaded', init
else
    do init
