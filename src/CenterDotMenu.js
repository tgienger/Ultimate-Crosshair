import React from 'react'

export default class CenterDotMenu extends React.Component {

    static propTypes = {};

    static defaultProps = {};

    state = {};

    constructor(props) {
        super(props)
    }

    componentWillMount() {}

    componentDidMount() {}

    componentWillUnMount() {}

    render() {
        const styles = {
            background: 'rgba(255,255,255,0.7)',
            color: 'black',
            fontWeight: 'bold',
            border: '1px solid rgb(190, 190, 190)',
            borderRadius: '3px',
            width: '215px',
            display: 'block',
            padding: '5px',
            marginBottom: '3px'
        }
        return (
            <div style={styles}>

            </div>
        );
    }
}
