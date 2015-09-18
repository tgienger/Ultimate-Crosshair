var CrossHair = React.createClass({displayName: "CrossHair",
    render: function() {
        return (
            React.createElement("div", {id: "crosshair-bounding-box"}, 
                React.createElement(SVGComponent, React.__spread({id: "crosshair"},  this.props), 
                    React.createElement(Cross, {
                        crossSpread: this.props.crossSpread, 
                        crossLength: this.props.crossLength, 
                        strokeWidth: this.props.strokeWidth}), 

                    React.createElement(Centerdot, React.__spread({},  this.props))
                )
            )
        );
    }
})
