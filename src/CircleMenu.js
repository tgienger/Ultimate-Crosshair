import React from 'react'
import SVGComponent from './SVGComponent'
import CircleButton from './CircleButton'
import backgroundImg from './images/button_background.svg!image'
import ColorPicker from 'react-color'
import Sliders from './Sliders'
import 'greensock';
import GSAP from 'react-gsap-enhancer'


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
        } else {
            this.pickerAnim.tweenTo('collapse')
        }
    }

    toggleSliders = () => {
        this.setState({showSliders: !this.state.showSliders, showColorPicker: false})
        this.pickerAnim.tweenTo('collapse')
        if (!this.state.showSliders) {

            this.sliderAnim.tweenTo('open')
        } else {
            this.sliderAnim.tweenTo('collapse')
        }
        // this.setState({showColorPicker: 'none'})
        // if (this.state.showSliders === 'none') {
        //     this.setState({showSliders: 'block'})
        // } else {
        //     this.setState({showSliders: 'none'})
        // }
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
        const btn2Icons = 'icon icon-settings icon--grey'

        // positioning of bottom button
        const btn3Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '40px',
            left: '-103px'
        }

        // container holding slider menu
        const sliderContainer = {
            position: 'absolute',
            background: 'rgba(255,255,255,0.7)',
            color: 'black',
            fontWeight: 'bold',
            border: '1px solid rgb(190, 190, 190)',
            borderRadius: '3px',
            width: '215px',
            display: 'block',
            padding: '5px',
            left: '116px',
            top: '-130px',
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
            fontWeight: 'bold',
            borderBottom: '1px solid rgb(190, 190, 190)',
            borderLeft: '1px solid rgb(190, 190, 190)',
            borderRight: '1px solid rgb(190, 190, 190)',
            marginLeft: '-1px',
            // marginBottom: '10px',
            width: '215px',
        }
        return (
            <div className={'container2'}>

                <div style={containerStyles}>

                    <div key="graphicalMenu">
                        {/* Buttons */}
                        {/* Toggle Color Pickers */}
                        <CircleButton
                            handleClick={this.toggleColorPickers}
                            icons={btn1Icons}
                            btnStyles={btn1Styles} />

                        {/* Toggle Sliders */}
                        <CircleButton
                            handleClick={this.toggleSliders}
                            icons={btn2Icons}
                            btnStyles={btn2Styles} />

                        {/* !!! Unused Button !!! */}
                        <CircleButton
                            handleClick={this.props.handleDot}
                            btnStyles={btn3Styles} />

                        {/* Button background image */}
                        <img style={bgStyles} width="100px" src={backgroundImg.src} />
                    </div>



                    {/* Color Pickers */}
                    <div key="colorPicker" style={crosshairContainer} className="animatedMenu">
                        <div className="cross--color-picker-container">
                            <ColorPicker
                                type="chrome"
                                positionCSS={pickerCSSpos}
                                color={this.props.crossColor}
                                onChange={this.handleCrossColor} />
                            <p style={container_p} className="picker-title">Cross Color</p>
                        </div>
                    </div>


                    {/* Crosshair Sliders */}
                    <div key="sliderContainer" style={sliderContainer} className="animatedMenu">
                        <div>
                            <Sliders key="sliders"

                                /* Event Handlers */
                                handleChange={this.handleChange}

                                /* Props */
                                crossSize={this.props.crossSize}
                                crossSpread={this.props.crossSpread}
                                crossLength={this.props.crossLength}
                                dotDiameter={this.props.dotDiameter}
                                strokeWidth={this.props.strokeWidth}
                                opacity={this.props.opacity}
                                showSliders={this.state.showSliders} />
                        </div>
                    </div>

                </div>



            </div>
        )
    }
}
