import React from 'react'
import ReactDOM from 'react-dom'
import injectTapEventPlugin from 'react-tap-event-plugin'
import Main from './Main'

injectTapEventPlugin()

$.get("/nattoppet/info.json").done(data=>
    ReactDOM.render(<Main info={JSON.parse(data)} />, document.getElementById('app'))
)
