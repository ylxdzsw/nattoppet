window.sr = {}

# events: click, delay, sim
# time-for-delay: short, long
# fx: slide, fade, fx-[color]
# time-for-fx: fast, slow

sr.init = ->
    $.fn.enter = ->
        @addClass 'active'
        sr.fx ++sr.timeline, [].slice.call @find '.click, .delay, .sim'
    $.fn.exit = ->
        $('.active').removeClass 'active'
    $.fn.inview = ->
        {top, height} = @offset() ? {top:0, height:-1}
        top <= scrollY + innerHeight / 2 <= top + height

    sr.current = $('.scen').eq 0
    do sr.current.enter

    sr.timeline = 0

    $(window).on 'click', -> sr.clickListener?()
    $(window).on 'scroll', sr.update
    $(window).on 'resize', sr.update
    setInterval sr.update, 1000

sr.update = ->
    if not sr.current.inview()
        $('.scen').each ->
            $this = $ @
            if $this.inview()
                do sr.current.exit
                do $this.enter
                sr.current = $this
                false # stop iterating

sr.fx = (timeline, [head, tail...]) ->
    if not head?
        return

    head = $ head

    cb = ->
        if timeline isnt sr.timeline
            return
        head.addClass 'active'
        sr.fx timeline, tail

    if head.hasClass 'click'
        sr.clickListener = cb
    else if head.hasClass 'delay'
        if head.hasClass 'long'
            setTimeout cb, 800
        else if head.hasClass 'short'
            setTimeout cb, 200
        else
            setTimeout cb, 400
    else if head.hasClass 'sim'
        do cb
