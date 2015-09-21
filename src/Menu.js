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


function createRevealAnim({target}) {
    const sliders = target.find('sliders')
    let nodes = sliders[0].children;
    const slider = Array.prototype.slice.call(nodes);

    const timeline = new TimelineMax()
        .set(sliders, {
            scale: 1,
            y: 0,
            x:150
        })
        .pause()
        .add('open')
        .to(sliders, .2, {
            scale: 0,
            y: -200,
            x:150
        })
        .add('collapse')

    // TweenLite.set(sliders, {css:{transformPerspective:400, perspective:400,
    //     transformStyle:"preserve-3d"}});
    //
    // const timeline = new TimelineMax()
    //
    // timeline.set(sliders, {
    //     scale: 1
    // })
    // .pause()
    // .add('open')
    // .to(sliders, .2, {
    //     scale: 0
    // })
    //
    //
    // timeline.fromTo(target, .05, {css:{autoAlpha:0}}, {css:{autoAlpha:1},
    // immediateRender: true})
    //     .to(sliders, 0.3, {css:{rotationY:30, rotationX:20}})
    //     .add("z", "+=0.2")
    //
    // slider.forEach(function(element, index) {
    //     timeline.to(element, 0.2, {css:{z:getRandom(-50, 50)}}, "z")
    // })
    //
    // timeline.to(sliders, 1, {css:{rotationY:180, z:-180}, ease:Power2.easeOut},
    // "+=0.2")
    //         .to(sliders, 1, {css:{rotationX:180, z:-10}})
    //
    // slider.forEach(function(element, index) {
    //     timeline.to(element, 1, {css:{z:200,
    //     rotationX:getRandom(-360, 600), rotationY:getRandom(-360, -600), autoAlpha:0}}, 'explode')
    // })
    // timeline.add('collapse');

    return timeline
    // return new TimelineMax()
    //     .set(sliders, {
    //         x: 0
    //     })
    //     .pause()
    //     .add('open')
    //     .to(sliders, .2, {
    //         x: -1000
    //     })
    //     .add('collapse');
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
