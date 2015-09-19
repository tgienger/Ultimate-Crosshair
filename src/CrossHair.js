import React from 'react';
import SVGComponent from './SVGComponent';
import Cross from './Cross';
import Centerdot from './Centerdot';

export default class CrossHair extends React.Component {
    tween: {}

    componentDidMount() {

    }

    render() {

        return (
            <div id="crosshair-bounding-box">
                <SVGComponent ref="crosshair" id="crosshair" {...this.props}>
                    <Cross
                        crossSpread={this.props.crossSpread}
                        crossLength={this.props.crossLength}
                        strokeWidth={this.props.strokeWidth}
                        crossColor={this.props.crossColor} />

                    <Centerdot {...this.props}/>
                </SVGComponent>
            </div>
        );
    }
}
