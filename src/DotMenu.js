import React from 'react'

export default class DotMenu extends React.Component {

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
        const menuStyles = {
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontWeight: 'bold',
            // border: '1px solid rgb(190, 190, 190)',
            // borderRadius: '3px',
            width: '215px',
            display: 'block',
            padding: '5px',
            marginBottom: '3px'
        }

        const menuButtons = {
            width: '100%',
            height: '40px',
            margin: '3px'
        }

        const menuInput = {
            overflow: 'none'
        }

        return (
            <div style={menuStyles}>
                {/* Display different options for the center dot */}
                <div>
                    <button style={menuButtons} onClick={this.props.dot}>Dot</button>
                </div>
                <div>
                    <button style={menuButtons} onClick={this.props.square}>Square</button>
                </div>
                <div>
                    <button style={menuButtons} onClick={this.props.oval}>Oval</button>
                </div>
                <div>
                    <button style={menuButtons} onClick={this.props.triangle}>Triangle</button>
                </div>
                <div style={menuInput}>
                    <input type="file" />
                </div>
            </div>
        );
    }
}
