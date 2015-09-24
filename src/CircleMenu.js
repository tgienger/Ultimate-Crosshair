/* global Power1 */
/* global TimelineMax */


/**
 * TODO: Create menu for dot selection:
 *       Make selectable images, plus an input for an
 *       external image (http://)
 */


import React from 'react'
import SVGComponent from './SVGComponent'
import CircleButton from './CircleButton'
// import backgroundImg from './images/button_background.svg!image'
import ColorPicker from 'react-color'
import Sliders from './Sliders'
import 'greensock';
import GSAP from 'react-gsap-enhancer';
import CircleButtonGroup from './CircleButtonGroup';


function sliderAnim({target}) {
    const sliders = target.find('sliderContainer')

    const tl = new TimelineMax()
        tl.set(sliders, {
            scale: 1,
            x: 0,
            ease: Power1.easeOut,
        })
        .pause()
        tl.add('open')
        .to(sliders, .2, {
            scale: 0,
            x: -325,
            ease: Power1.easeOut,
        })
        tl.add('collapse')

    return tl
}

function pickerAnim({target}) {
    const picker = target.find('colorPicker')

    const tl = new TimelineMax()
        .set(picker, {
            scale: 1,
            x: 0,
            ease: Power1.easeOut
        })
        .pause()
        .add('open')
        .to(picker, .2, {
            scale: 0,
            x: -275,
            y: -50,
            ease: Power1.easeOut
        })
        .add('collapse')

    return tl
}

@GSAP()
export default class CircleMenu extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            backgroundStyles: {
                display: 'none'
            },
            showColorPicker: false,
            showSliders: false
        }
    }

    componentDidMount() {
        this.sliderAnim = this.addAnimation(sliderAnim).seek('collapse')
        this.pickerAnim = this.addAnimation(pickerAnim).seek('collapse')
    }

    toggleColorPickers = () => {

        this.setState({showSliders: false, showColorPicker: !this.state.showColorPicker})
        this.sliderAnim.tweenTo('collapse');

        if (!this.state.showColorPicker) {
            this.pickerAnim.tweenTo('open')
        }
        else {
            this.pickerAnim.tweenTo('collapse')
        }
    }

    toggleSliders = () => {
        this.setState({showSliders: !this.state.showSliders, showColorPicker: false})
        this.pickerAnim.tweenTo('collapse')
        if (!this.state.showSliders) {

            this.sliderAnim.tweenTo('open')
        }
        else {
            this.sliderAnim.tweenTo('collapse')
        }
    }

    handleToggles = (state) => {
        let val = !this.state[state]
        let newState = {}
        newState[state] = val
        this.setState(newState)
    }


    handleChange = (state, val) => {
        this.props.handleChange(state, val);
    }


    handleCrossColor = (color) => {
        let newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
        this.props.handleChange('crossColor', newColor);
    }


    render() {
        // Container Holding entire menu
        // used for absolute positioning at center of screen
        const containerStyles = {
            position: 'relative',
            top: 0,
            left:0,

        }

        // container holding slider menu
        const sliderContainer = {
            position: 'absolute',
            width: '215px',
            left: '116px',
            top: '-170px',
        }
        const crosshairContainer = {
            position: 'absolute',
            width: '215px',
            top: '-140px',
            left: '116px'
        }
        const pickerCSSpos = {
            // position: 'relative',
            // left: '-19px',
        }
        const container_p = {
            textAlign: 'center',
            padding: '5px',
            fontWeight:'bold',
            background: 'white',
            color: 'black',
            borderBottom: '1px solid rgb(190, 190, 190)',
            borderLeft: '1px solid rgb(190, 190, 190)',
            borderRight: '1px solid rgb(190, 190, 190)',
            marginLeft: '-1px',
            // marginBottom: '10px',
            width: '215px',
        }

        // He're we'll decide if these menus are to be shown or not
        // if not, we wont bother rendering them.
        let sliderMenu;
        if (this.state.showSliders) {
            sliderMenu = (<Sliders key="sliders"

                /* Event Handlers */
                handleChange={this.handleChange}

                /* Props */
                crossSize={this.props.crossSize}
                crossSpread={this.props.crossSpread}
                crossLength={this.props.crossLength}
                dotDiameter={this.props.dotDiameter}
                strokeWidth={this.props.strokeWidth}
                opacity={this.props.opacity}
                showSliders={this.state.showSliders} />);
        }

        let colorPicker;
        if (this.state.showColorPicker) {
            colorPicker = (
            <div className="cross--color-picker-container">
                <ColorPicker
                    type="chrome"
                    positionCSS={pickerCSSpos}
                    color={this.props.crossColor}
                    onChange={this.handleCrossColor} />
                <p style={container_p} className="picker-title">Cross Color</p>
            </div>);
        }

        return (
            <div className={'container2'}>

                <div style={containerStyles}>

                    <CircleButtonGroup
                        toggleColorPickers={this.toggleColorPickers}
                        toggleSliders={this.toggleSliders}
                        handleDot={this.props.handleDot} />


                    {/* Color Pickers */}
                    <div key="colorPicker" style={crosshairContainer} className="animatedMenu">
                        {colorPicker}
                    </div>


                    {/* Crosshair Sliders */}
                    <div key="sliderContainer" style={sliderContainer} className="animatedMenu">
                        {sliderMenu}
                    </div>

                </div>



            </div>
        )
    }
}
