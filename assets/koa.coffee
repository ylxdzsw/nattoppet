$ ->
    $(".section-header").forEach (section, index) ->
        section = $ section
        section.attr 'id', "section-#{index}"
        $("<li><a href=\"#section-#{index}\">#{section.text()}</a></li>").appendTo '#nav-menu'

