import React from 'react';
import CrossHair from './CrossHair';
import CircleMenu from './CircleMenu'

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
            <div id={'container1'}>

                <CircleMenu
                    /* Event Handlers */
                    toggleSliders={this.toggleSliders}
                    handleChange={this.handleState}

                    /* Props */
                    crossSize={this.state.crossSize}
                    crossSpread={this.state.crossSpread}
                    crossLength={this.state.crossLength}
                    dotDiameter={this.state.dotDiameter}
                    strokeWidth={this.state.strokeWidth}
                    opacity={this.state.opacity}
                    crossColor={this.state.crossColor}
                    handleDot={this.handleDot}

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
