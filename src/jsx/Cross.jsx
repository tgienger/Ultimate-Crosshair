
var Cross = React.createClass({

    getInitialState: function() {
        return ({
            shape: 0,
            size: 0,
            color: "green"
        });
    },

    changeShape: function() {
        var n = this.state.shape + 1;
        this.setState({
            shape: n < 3 ? n : 0
        })
    },

    changeColor: function() {
        var n = this.state.color + 1;
        this.setState({
            color: n < 4 ? n : 0
        });
    },

    render: function() {
        var color = this.state.color;
        var size = (this.state.size * 20) + 20;
        var spread = parseInt(this.props.crossSpread);
        var length = parseInt(this.props.crossLength);

        var x = 50 - (size / 2);
        var y = 50 - (size / 2);
        var x1=25,y1=25,x2=75,y2=75;
        var strokeWidth = parseInt(this.props.strokeWidth);
        var opacity = parseInt(this.props.opacity);

        leftBar =
            <Line
                x1={0 - length}    // outside - Length
                y1="50%"  // outside
                x2={50 - spread}  // center - Spread
                y2="50%"  // center
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;
        topBar =
            <Line
                x1="50%"  // outside
                y1={0 - length}    // outside - Length
                x2="50%"  // center
                y2={50 - spread}  // center - Spread
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;
                
        rightBar =
            <Line
                x1={100 + length} // outside - Length
                y1="50%"  // outside
                x2={50 + spread}  // center - Spread
                y2="50%"  // center
                strokeWidth={strokeWidth}
                stroke={color}
                strokeOpacity={opacity} />;

        bottomBar =
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
});
