
var Centerdot = React.createClass({displayName: "Centerdot",

    getInitialState: function() {
        return ({
            shape: 0,
            size: 0,
            color: 0
        });
    },
    //
    // changeShape: function() {
    //     var n = this.state.shape + 1;
    //     this.setState({
    //         shape: n < 3 ? n : 0
    //     });
    // },
    //
    // changeSize: function() {
    //     var n = this.state.size + 1;
    //     this.setState({
    //         size: n < 4 ? n : 0
    //     });
    // },
    //
    // changeColor: function() {
    //     var n = this.state.color + 1;
    //     this.setState({
    //         color: n < 4 ? n : 0
    //     });
    // },

    render: function() {
        var color = ['red', 'green', 'blue', 'orange'][this.state.color];
        var size = parseInt(this.props.dotDiameter);
        var shape;
        switch (this.props.centerDot) {
            case 0:
                var x = 50 - (size / 2);
                var y = 50 - (size / 2);
                shape =
                    React.createElement(Rectangle, {
                        key: "the-shape", 
                        x: x, 
                        y: y, 
                        width: size, 
                        height: size, 
                        fill: color});
                break;
            case 1:
                shape =
                    React.createElement(Circle, {
                        key: "the-shape", 
                        cx: "50%", 
                        cy: "50%", 
                        r: size / 2, 
                        fill: color});
                break;
            case 2:
                shape =
                    React.createElement(Ellipse, {
                        key: "the-shape", 
                        cx: "50%", 
                        cy: "50%", 
                        rx: size / 2, 
                        ry: size / 2 * 0.75, 
                        fill: color});
                break;
        }
        return(
            React.createElement("g", null, 
                shape
            )
        )
    }
});
