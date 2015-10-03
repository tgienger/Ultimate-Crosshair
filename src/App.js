import React from 'react';
import CrossHair from './CrossHair';
import CircleMenu from './CircleMenu'

export default class App extends React.Component {
    constructor() {
        super();
        if (localStorage.state) {
            this.state = JSON.parse(localStorage.state);
        } else {
            this.state = {
                centerDot: 0,
                crossSize: 100,
                crossSpread: 0,
                crossLength: 0,
                crossColor: {r:0,g:255,b:0,a:1},
                dotColor: {r:0,g:255,b:0,a:1},
                currentColor: {r:0,g:255,b:0,a:1},
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
    }



    componentDidUpdate(prevProps, prevState) {
        localStorage.state = JSON.stringify(this.state);
    }


    handleDot = (n) => {
        this.setState({
            centerDot: n
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

        let crossHair;
        if (this.state.opacity > 0) {

            crossHair = (
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
                    dotColor={this.state.dotColor}
                    viewBox="0 0 100 100" />
            );
        }
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
                    dotColor={this.state.dotColor}
                    currentColor={this.state.currentColor}
                    handleDot={this.handleDot}

                    key="menu" />

                {crossHair}

            </div>
        );
    }
}
