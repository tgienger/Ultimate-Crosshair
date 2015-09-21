import React from 'react';
import SVGComponent from './SVGComponent';
import Cross from './Cross';
import Centerdot from './Centerdot';

export default class CrossHair extends React.Component {
    render() {

        return (
            <div id={"crosshair-bounding-box"} className={'container1'}>
                <SVGComponent ref="crosshair" id="crosshair" {...this.props}>
                    <Cross
                        crossSpread={this.props.crossSpread}
                        crossLength={this.props.crossLength}
                        strokeWidth={this.props.strokeWidth}
                        crossColor={this.props.crossColor} />

                    <Centerdot
                        dotDiameter={this.props.dotDiameter}
                        centerDot={this.props.centerDot} />
                </SVGComponent>
            </div>
        );
    }
}
