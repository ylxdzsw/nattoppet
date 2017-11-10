# events: click, delay, sim
# time-for-delay: short, long
# fx: slide, fade, fx-[color]
# time-for-fx: fast, slow

current = null
timeline = 0
clickListener = ->

$.fn.enter = ->
    @addClass 'active'
    fx ++timeline, [].slice.call @find '.click, .delay, .sim'

$.fn.inview = ->
    {top, height} = @offset() ? {top:0, height:-1}
    top <= scrollY + innerHeight / 2 <= top + height

update = ->
    if not current.inview()
        $('.scen').each ->
            $this = $ @
            if $this.inview()
                $('.active').removeClass 'active'
                do $this.enter
                current = $this
                false # stop iterating

fx = (t, [head, tail...]) ->
    if not head?
        return

    head = $ head

    cb = ->
        if t isnt timeline
            return
        head.addClass 'active'
        fx t, tail

    if head.hasClass 'click'
        clickListener = cb
    else if head.hasClass 'delay'
        if head.hasClass 'long'
            setTimeout cb, 800
        else if head.hasClass 'short'
            setTimeout cb, 200
        else
            setTimeout cb, 400
    else if head.hasClass 'sim'
        do cb

$ ->
    current = $('.scen').eq 0
    do current.enter

    $(window).on 'click', -> do clickListener
    $(window).on 'scroll', update
    $(window).on 'resize', update
    setInterval update, 1000
