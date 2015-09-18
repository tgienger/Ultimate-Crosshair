
var Centerdot = React.createClass({

    getInitialState: function() {
        return ({
            shape: 0,
            size: 0,
            color: 0
        });
    },

    render: function() {
        var color = ['red', 'green', 'blue', 'orange'][this.state.color];
        var size = parseInt(this.props.dotDiameter);
        var shape;
        switch (this.props.centerDot) {
            case 0:
                var x = 50 - (size / 2);
                var y = 50 - (size / 2);
                shape =
                    <Rectangle
                        key="the-shape"
                        x={x}
                        y={y}
                        width={size}
                        height={size}
                        fill={color} />;
                break;
            case 1:
                shape =
                    <Circle
                        key="the-shape"
                        cx="50%"
                        cy="50%"
                        r={size / 2}
                        fill={color} />;
                break;
            case 2:
                shape =
                    <Ellipse
                        key="the-shape"
                        cx="50%"
                        cy="50%"
                        rx={size / 2}
                        ry={size / 2 * 0.75}
                        fill={color} />;
                break;
        }
        return(
            <g>
                {shape}
            </g>
        )
    }
});
