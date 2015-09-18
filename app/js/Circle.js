var Circle = React.createClass({displayName: "Circle",
    render: function() {
        return (
            React.createElement("circle", React.__spread({},  this.props), this.props.children)
        );
    }
});
