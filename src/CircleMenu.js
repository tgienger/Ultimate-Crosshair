/* global Power1 */
/* global TimelineMax */

import React from 'react'
import SVGComponent from './SVGComponent'
import CircleButton from './CircleButton'
// import backgroundImg from './images/button_background.svg!image'
import ColorPicker from 'react-color'
import Sliders from './Sliders'
import 'greensock';
import GSAP from 'react-gsap-enhancer';
import CircleButtonGroup from './CircleButtonGroup';
import DotMenu from './DotMenu';


function menuAnim({target, options}) {
    const menu = target.find(options.key)

    const tl = new TimelineMax()
    tl.set(menu, {
        scale: 0,
        x: options.x,
        y: options.y
    })
    .to(menu, .3, {
        scale: 1,
        x: 0,
        y: 0,
        ease: Power1.easeOut
    })

    return tl
}

@GSAP()
export default class CircleMenu extends React.Component {

    state = {
        backgroundStyles: {
            display: 'none'
        },
        showColorPicker: false,
        showSliders: false,
        showDotMenu: false,
        currentColorSelection: 'Cross Color',
        currentColor: this.props.crossColor
    }

    dotMenu = {
        key: 'dotMenu',
        x: -275,
        y: 20
    }

    colorPicker = {
        key: 'colorPicker',
        x: -275,
        y: -50
    }

    sliderContainer = {
        key: 'sliderContainer',
        x: -325,
        y: 0
    }

    constructor(props) {
        super(props)
    }


    toggleColorPickers = () => {
        this.setState({showSliders: false, showColorPicker: !this.state.showColorPicker, showDotMenu: false})
        if (!this.state.showColorPicker) {
            this.addAnimation(menuAnim, this.colorPicker)
        }
    }

    toggleSliders = () => {
        this.setState({showSliders: !this.state.showSliders, showColorPicker: false, showDotMenu: false})
        if (!this.state.showSliders) {
            this.addAnimation(menuAnim, this.sliderContainer)
        }
    }


    toggleDotMenu = () => {
        this.setState({showSliders: false, showColorPicker: false, showDotMenu: !this.state.showDotMenu})
        if (!this.state.showDotMenu) {
            this.addAnimation(menuAnim, this.dotMenu)
        }

    }


    handleChange = (state, val) => {
        this.props.handleChange(state, val);
    }


    handleColorChange = (color) => {
        // let newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
        let newColor = color.rgb;
        this.setState({currentColor: newColor});
        let changed;

        if (this.state.currentColorSelection === 'Cross Color') {
            changed = 'crossColor';
        } else {
            changed = 'dotColor';
        }

        this.props.handleChange(changed, newColor);
    }

    // Toggles color selection between the cross and dot
    toggleColorSelection = () => {
        let newSelection; // which are we working on now, cross or dot
        let currentColor; // which color is currently selected for the current options (dot or cross).

        if (this.state.currentColorSelection === 'Cross Color') {
            newSelection = 'Dot Color';
            currentColor = this.props.dotColor;
        } else {
            newSelection = 'Cross Color';
            currentColor = this.props.crossColor;
        }
        this.setState({currentColor: currentColor, currentColorSelection: newSelection});
    }

    setDot = () => {
        this.props.handleDot(0);
    }

    setSquare = () => {
        this.props.handleDot(1);
    }

    setOval = () => {
        this.props.handleDot(2);
    }

    setTriangle = () => {
        this.props.handleDot(3);
    }

    render() {
        // Container Holding entire menu
        // used for absolute positioning at center of screen
        const containerStyles = {
            position: 'relative',
            zIndex: 3,
            top: 0,
            left:0,

        };
        // container holding slider menu
        const sliderContainer = {
            position: 'absolute',
            width: '215px',
            left: '116px',
            top: '-170px',
        };
        const crosshairContainer = {
            position: 'absolute',
            width: '215px',
            top: '-140px',
            left: '116px'
        };
        const dotContainer = {
            position: 'absolute',
            width: '215px',
            left: '116px',
            top: '-95px'
        };
        const pickerCSSpos = {
            // position: 'relative',
            // left: '-19px',
        };
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
        };

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


        const currentColor = `rgba(${this.state.currentColor.r}, ${this.state.currentColor.g}, ${this.state.currentColor.b}, ${this.state.currentColor.a})`;

        let colorPicker;
        if (this.state.showColorPicker) {
            colorPicker = (
            <div className="cross--color-picker-container">
                <ColorPicker
                    type="chrome"
                    positionCSS={pickerCSSpos}
                    color={currentColor}
                    onChange={this.handleColorChange} />
                <p style={container_p} onClick={this.toggleColorSelection} className="picker-title"><a href="#">&laquo; {this.state.currentColorSelection} &raquo;</a></p>
            </div>);
        }

        let centerDot;
        if (this.state.showDotMenu) {
            centerDot = (
                <DotMenu
                    dot={this.setDot}
                    square={this.setSquare}
                    oval={this.setOval}
                    triangle={this.setTriangle} />
            );
        }

        return (
            <div className={'container2'}>

                <div style={containerStyles}>

                    {/* Menu Buttons */}
                    <CircleButtonGroup
                        toggleColorPickers={this.toggleColorPickers}
                        toggleSliders={this.toggleSliders}
                        handleDot={this.toggleDotMenu} />


                    {/* Center Dot Selection Menu */}
                    <div key="dotMenu" style={dotContainer} >
                        {centerDot}
                    </div>


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
