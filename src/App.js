import React from 'react';
import Menu from './Menu';
import CrossHair from './CrossHair';
import MenuToggle from './MenuToggle';
import poo from 'greensock';
// import draggable from 'greensock';
import GSAP from 'react-gsap-enhancer';
import CircleMenu from './CircleMenu'

function createAnim({target}) {
    const menu = target.find('menu')
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
export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            centerDot: 0,
            crossSize: 100,
            crossSpread: 0,
            crossLength: 0,
            crossColor: "rgba(0, 255, 0, 1)",
            dotDiameter: 10,
            strokeWidth: 1,
            spinning: false,
            showMenu: false,
            showSliders: false,
            showColorPicker: false,
            opacity: 1,
            color: 0
        }
    }

    componentDidMount() {
        this.anim = this.addAnimation(createAnim)
            .seek('open')
    }

    handleDot = () => {
        var n = this.state.centerDot + 1;
        this.setState({
            centerDot: n < 3 ? n : 0
        });
    }

    handleState = (state, value) => {
        var newState = {};
        newState[state] = value;
        this.setState(newState);
    }

    toggleColorPicker = () => {
        this.setState({showColorPicker: !this.state.showColorPicker})
    }

    toggleSliders = () => {
        this.setState({showSliders: !this.state.showSliders})
    }

    handleClick = () => {
        this.setState({showMenu: !this.state.showMenu})
        if (this.state.showMenu) {
            this.anim.tweenTo('collapse')
        } else {
            this.anim.tweenTo('open')
        }
    }

    handleColorClose = () => {
        this.setState({
            showColorPicker: false
        });
    }

    render() {
        return (
            <div id={'container1'} className={""}>
                <MenuToggle
                    handleClick={this.handleClick}
                    top="0"
                    left="0" />

                <Menu

                    /* Event Handlers */
                    handleDot={this.handleDot}
                    toggleSliders={this.toggleSliders}
                    handleColorClose={this.handleColorClose}
                    toggleColorPicker={this.toggleColorPicker}
                    handleChange={this.handleState}

                    /* Props */
                    crossSize={this.state.crossSize}
                    crossSpread={this.state.crossSpread}
                    crossLength={this.state.crossLength}
                    dotDiameter={this.state.dotDiameter}
                    strokeWidth={this.state.strokeWidth}
                    opacity={this.state.opacity}
                    spinning={this.state.spinning}
                    crossColor={this.state.crossColor}
                    sliderVisible={this.state.sliderVisible}
                    showSliders={this.state.showSliders} />

                <CircleMenu
                    key="menu" />

                <CrossHair
                    centerDot={this.state.centerDot}
                    height={this.state.crossSize}
                    width={this.state.crossSize}
                    crossSpread={this.state.crossSpread}
                    crossLength={this.state.crossLength}
                    dotDiameter={this.state.dotDiameter}
                    strokeWidth={this.state.strokeWidth}
                    opacity={this.state.opacity}
                    spinning={this.state.spinning}
                    crossColor={this.state.crossColor}
                    viewBox="0 0 100 100" />
            </div>
        );
    }
}
