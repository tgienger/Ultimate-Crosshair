var Rectangle = React.createClass({displayName: "Rectangle",
    render: function() {
        return (
            React.createElement("rect", React.__spread({},  this.props), this.props.children)
        );
    }
});
