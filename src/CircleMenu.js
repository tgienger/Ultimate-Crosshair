import React from 'react'
import SVGComponent from './SVGComponent'
import CircleButton from './CircleButton'
import backgroundImg from './images/button_background.svg!image'
import ColorPicker from 'react-color'
import Sliders from './Sliders'
import GSAP from 'react-gsap-enhancer'


function enterAnim({target}) {
    const menu = target.findAll('.animatedMenu')
    return new TimelineMax()
        .set(menu, {
            scale: 1
        })
        .pause()
        .add('open')
        .to(menu, .5, {
            x: 50,
            ease: Linear.easeNone,
        }, '-=0.7')
        .to(menu, .5, {
            scale: 0,
            x: 0,
            ease: Power1.easeOut,
            // rotationZ:"360deg",
        })
        .add('collapse');
}


@GSAP()
export default class CircleMenu extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            backgroundStyles: {
                display: 'none'
            },
            showColorPicker: 'none',
            showSliders: 'none'
        }
    }

    componentDidMount() {
        this.anim = this.addAnimation(enterAnim)
            .seek('open')
    }

    toggleColorPickers = () => {
        this.setState({showSliders: 'none'})
        if (this.state.showColorPicker === 'none') {
            this.setState({showColorPicker: 'flex'})
        } else {
            this.setState({showColorPicker: 'none'})
        }
    }

    toggleSliders = () => {
        this.setState({showColorPicker: 'none'})
        if (this.state.showSliders === 'none') {
            this.setState({showSliders: 'block'})
        } else {
            this.setState({showSliders: 'none'})
        }
    }

    handleToggles = (state) => {
        let val = !this.state[state]
        let newState = {}
        newState[state] = val
        this.setState(newState)
    }

    render() {

        const containerStyles = {
            position: 'relative'
        }
        const bgStyles = {
            // zIndex: 90,
            position: 'absolute',
            top: '-93px',
            left: '-150px',
            transform:'rotate(180deg)'
        }
        const btn1Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-90px',
            left: '-103px'
        }
        const btn2Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-24px',
            left: '-147px'
        }
        const btn3Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '40px',
            left: '-103px'
        }
        const sliderContainer = {
            position: 'absolute',
            left: '100px',
            top: '-90px',
            display: this.state.showSliders
        }
        const crossContainer = {
            position: 'absolute',
            left: '100px',
            top: '-270px',
            display: this.state.showColorPicker,
            alignItems: 'center',
            justifyContent: 'center'
        }
        const dotContainer = {
            position: 'absolute',
            left: '100px',
            top: '20px',
            display: this.state.showColorPicker,
            alignItems: 'center',
            justifyContent: 'center'
        }
        return (
            <div className={'container2'}>

                <div style={containerStyles}>

                    {/* Buttons */}
                    {/* Toggle Color Pickers */}
                    <CircleButton
                        handleClick={this.toggleColorPickers}
                        handleToggles={this.handleToggles}
                        btnStyles={btn1Styles} />

                    {/* Toggle Sliders */}
                    <CircleButton
                        handleClick={this.toggleSliders}
                        btnStyles={btn2Styles} />
                    <CircleButton
                        btnStyles={btn3Styles} />
                    <img style={bgStyles} width="100px" src={backgroundImg.src} />


                    {/* Color Pickers */}
                    <div className="animatedMenu">
                        <div style={crossContainer} className="cross--color-picker-container">
                            <ColorPicker
                                type="chrome"
                                position="right"
                                color={this.props.crossColor}
                                display={this.state.showColorPicker}
                                onChange={this.handleCrossColor}
                                onClose={this.handleColorClose} />
                            <span className="picker-title">Cross Color</span>
                        </div>

                        <div style={dotContainer} className="dot--color-picker-container">
                            <ColorPicker
                                type="chrome"
                                position="right"
                                color={this.props.dotColor}
                                display={this.state.showColorPicker}
                                onChange={this.handleDotColor}
                                onClose={this.handleColorClose} />
                            <span className="picker-title">Dot Color</span>
                        </div>
                    </div>


                    {/* Crosshair Sliders */}
                    <div className="animatedMenu">
                        <div style={sliderContainer}>
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
