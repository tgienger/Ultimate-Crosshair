import React from 'react';
import CircleButton from './CircleButton';

export default class CircleButtonGroup extends React.Component {

    static propTypes = {};

    static defaultProps = {};

    state = {};

    constructor(props) {
        super(props)
        this.backgroundImg = {src: './src/images/button_background.svg'};
    }

    componentWillMount() {}

    componentDidMount() {}

    componentWillUnMount() {}

    render() {

        // Styles for the button background svg
        const bgStyles = {
            // zIndex: 90,
            position: 'absolute',
            top: '-93px',
            left: '-150px',
            transform:'rotate(180deg)'
        }

        // positioning of top button
        const btn1Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-90px',
            left: '-103px'
        }
        const btn1Icons = 'icon icon-paint icon--grey'

        // positioning of middle button
        const btn2Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-24px',
            left: '-147px'
        }
        const btn2Icons = 'icon icon-sliders icon--grey'

        // positioning of bottom button
        const btn3Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '40px',
            left: '-103px'
        }
        const btn3Icons = 'icon icon-gear icon--grey'

        return (
            <div key="graphicalMenu">
                {/* Buttons */}
                {/* Toggle Color Pickers */}
                <CircleButton
                    handleClick={this.props.toggleColorPickers}
                    icons={btn1Icons}
                    btnStyles={btn1Styles} />

                {/* Toggle Sliders */}
                <CircleButton
                    handleClick={this.props.toggleSliders}
                    icons={btn2Icons}
                    btnStyles={btn2Styles} />

                {/* !!! Unused Button !!! */}
                <CircleButton
                    handleClick={this.props.handleDot}
                    icons={btn3Icons}
                    btnStyles={btn3Styles} />

                {/* Button background image */}
                <img style={bgStyles} width="100px" src={this.backgroundImg.src} />
            </div>
        );
    }
}
