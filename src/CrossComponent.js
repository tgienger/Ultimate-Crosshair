import React from 'react';
import CrossHair from './CrossHair';

export default class CrossComponent extends React.Component {
    constructor() {
        super();
        if (window.localStorage.state) {
            this.state = JSON.parse(localStorage.state);
        } else {
            this.state = {
                centerDot: 0,
                crossSize: 100,
                crossSpread: 0,
                crossLength: 0,
                crossColor: {r: 0, g: 255, b: 0, a: 1},
                dotColor: {r: 0, g: 255, b: 0, a: 1},
                currentColor: {r: 0, g: 255, b: 0, a: 1},
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
    
    handleState = e => {
        let newState = JSON.parse(localStorage.state);
        this.setState(newState);
    }
    
    componentDidMount() {
        window.addEventListener('storage', this.handleState, false);
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
            )
        }
        return <div>{crossHair}</div>;
    }
}