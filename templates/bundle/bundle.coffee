window.sr = {}

sr.init = ->
    sr.current = $('.scen').eq 0

    $.fn.enter = ->
        @addClass 'active'
    $.fn.exit = ->
        @removeClass 'active'
    $.fn.inview = ->
        console.log @offset()
        {top, height} = @offset() ? {top:0, height:-1}
        top <= scrollY + innerHeight / 2 <= top + height

    $(window).on 'scroll', sr.update

sr.update = ->
    if not sr.current.inview()
        $('.scen').each ->
            $this = $ @
            if $this.inview()
                do $this.enter
                do sr.current.exit
                sr.current = $this
                false # stop iterating
