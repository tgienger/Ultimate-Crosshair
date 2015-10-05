import React from 'react';
import SVGComponent from './SVGComponent';
import Cross from './Cross';
import Centerdot from './Centerdot';

export default class CrossHair extends React.Component {
    render() {
        
        let cross;
        if (this.props.crossColor.a) {
            cross = (
                <Cross
                    crossSpread={this.props.crossSpread}
                    crossLength={this.props.crossLength}
                    strokeWidth={this.props.strokeWidth}
                    crossColor={`rgba(${this.props.crossColor.r},${this.props.crossColor.g},${this.props.crossColor.b},${this.props.crossColor.a})`} />
            );
        }
        
        let dot;
        if (this.props.dotColor.a) {
            dot = (
                <Centerdot
                    dotDiameter={this.props.dotDiameter}
                    dotColor={`rgba(${this.props.dotColor.r},${this.props.dotColor.g},${this.props.dotColor.b},${this.props.dotColor.a})`}
                    centerDot={this.props.centerDot} />
            );
        }

        const imageContainer = {
            width: '500px',
            hight: '500px',
            background: 'yellow'
        }

        let crossBars;
        if (this.props.crossColor.a) {
            let crossBarColor = `rgba(
                ${this.props.crossColor.r},
                ${this.props.crossColor.g},
                ${this.props.crossColor.b},
                ${this.props.crossColor.a})`;

            crossBars = (
                <Cross
                    crossSpread={this.props.crossSpread}
                    crossLength={this.props.crossLength}
                    strokeWidth={this.props.strokeWidth}
                    crossColor={crossBarColor} />
            );
        }


        let centerDot;
        if (this.props.dotColor.a) {

            const dotColor = `rgba(
                ${this.props.dotColor.r},
                ${this.props.dotColor.g},
                ${this.props.dotColor.b},
                ${this.props.dotColor.a}
            )`;

            centerDot = (
                <Centerdot
                    dotDiameter={this.props.dotDiameter}
                    dotColor={dotColor}
                    centerDot={this.props.centerDot} />
            );
        }


        return (
            <div id={"crosshair-bounding-box"} className={'container1'}>
                <SVGComponent ref="crosshair" id="crosshair" {...this.props}>
                    {cross}

                    {dot}
                </SVGComponent>
            </div>
        );
    }
}
