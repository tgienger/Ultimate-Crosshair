import React from 'react';
import Slider from './Slider';
import Sliders from './Sliders';
import Buttons from './Buttons'
import ColorPicker from 'react-color';
import 'greensock';
import GSAP from 'react-gsap-enhancer';


function getRandom(max, min){
    return Math.floor(Math.random() * (1 + max - min) + min);
}



@GSAP()
export default class Menu extends React.Component {
    constructor() {
        super();

        this.state = {
            showSliders: false,
            showColorPicker: false
        };
    }

    componentDidMount() {
        this.anim = this.addAnimation(createRevealAnim)
            .seek('collapse')
    }

    handleSpin = () => {
        this.props.handleSpin(this.tween);
    }

    handleColorClose = () => {
        this.setState({
            showColorPicker: false
        });
    }

    handleCrossColor = (color) => {
        let newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
        this.props.handleChange('crossColor', newColor);
    }

    handleToggles = (state) => {
        let val = !this.state[state];
        let newState = {};
        newState[state] = val;
        this.setState(newState);
    }

    handleChange = (state, val) => {
        this.props.handleChange(state, val);
    }

    handleOpenClick = () => {
        this.setState({showSliders: !this.state.showSliders})
        if (this.state.showSliders) {
            this.anim.tweenTo('collapse')
        } else {
            this.anim.tweenTo('open')
        }
    }

    render() {
        const styles = {
            zIndex: 9999,
            width: "200px",
            height: "200px",
            position: "absolute",
            margin: 0,
            padding: 0,
            top: '100px',
            left: '100px'
        }
        //TODO: implement slide menu toggle
        return (
            <div style={styles} id={"menu"} className={"menu"}>

                {/* Main Menu */}
                <Buttons
                    handleOpenClick={this.handleOpenClick}
                    handleToggles={this.handleToggles}
                    handleDot={this.props.handleDot} />


                {/* Color Picker */}
                <ColorPicker
                    type="chrome"
                    position="right"
                    color={this.props.crossColor}
                    display={this.state.showColorPicker}
                    onChange={this.handleCrossColor}
                    onClose={this.handleColorClose} />


                {/* Crosshair Sliders */}
                <Sliders key="sliders"

                    /* Event Handlers */
                    handleChange={this.handleChange}

                    /* Props */
                    crossSize={this.props.crossSize}
                    crossSpread={this.props.crossSpread}
                    crossLength={this.props.crossLength}
                    dotDiameter={this.props.dotDiameter}
                    strokeWidth={this.props.strokeWidth}
                    opacity={this.props.opacity} />


            </div>
        )
    }
}
// export default GSAP()(Menu);
