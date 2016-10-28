window.sr = {}

sr.init = ->
    $.fn.enter = ->
        @addClass 'active'
    $.fn.exit = ->
        @removeClass 'active'
    $.fn.inview = ->
        {top, height} = @offset() ? {top:0, height:-1}
        top <= scrollY + innerHeight / 2 <= top + height

    sr.current = $('.scen').eq 0
    do sr.current.enter
    
    $(window).on 'scroll', sr.update
    $(window).on 'resize', sr.update
    setInterval sr.update, 1000

sr.update = ->
    if not sr.current.inview()
        $('.scen').each ->
            $this = $ @
            if $this.inview()
                do $this.enter
                do sr.current.exit
                sr.current = $this
                false # stop iterating
