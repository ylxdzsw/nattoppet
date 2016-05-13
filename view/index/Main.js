import React from 'react'
import RefreshIndicator from 'material-ui/lib/refresh-indicator'

const styles = {

}

class Main extends React.Component {
    constructor(props, context) {
        super(props, context)

        this.state = {

        }
    }

    render() {
        return (
            <div>
                <h1> hello world </h1>
                <div> {this.props.info} </div>
            </div>
        )
    }
}

export default Main
