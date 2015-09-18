var SVGComponent = React.createClass({displayName: "SVGComponent",
    render: function() {
        return (
            React.createElement("svg", React.__spread({},  this.props), this.props.children)
        );
    }
});
