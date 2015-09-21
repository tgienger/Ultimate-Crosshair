import React from 'react';
import Line from './Line';

export default class Cross extends React.Component {
    constructor(props) {
        super();
        this.state = {
            shape: 0,
            size: 0,
            color: "rgba(120, 120, 120, 0.8)"
        };
    }

    render() {
        var color = this.props.crossColor;

        var size = (this.state.size * 20) + 20;
        var spread = parseInt(this.props.crossSpread);
        var length = parseInt(this.props.crossLength);

        var x = 50 - (size / 2);
        var y = 50 - (size / 2);
        var x1=25,y1=25,x2=75,y2=75;
        var strokeWidth = parseInt(this.props.strokeWidth);
        var opacity = parseInt(this.props.opacity);

        var leftBar =
            <Line
                x1={0 - length}    // outside - Length
                y1="50%"  // outside
                x2={50 - spread}  // center - Spread
                y2="50%"  // center
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;
        var topBar =
            <Line
                x1="50%"  // outside
                y1={0 - length}    // outside - Length
                x2="50%"  // center
                y2={50 - spread}  // center - Spread
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;

        var rightBar =
            <Line
                x1={100 + length} // outside - Length
                y1="50%"  // outside
                x2={50 + spread}  // center - Spread
                y2="50%"  // center
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;

        var bottomBar =
            <Line
                x1="50%"   // center
                y1={50 + spread}   // center - Spread
                x2={50}   // outside
                y2={100 + length}  // outside - Length
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;

        return(
            <g>
                {leftBar}
                {topBar}
                {rightBar}
                {bottomBar}
            </g>
        )
    }
}
