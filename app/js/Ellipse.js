var Ellipse = React.createClass({displayName: "Ellipse",
    render: function() {
        return (
            React.createElement("ellipse", React.__spread({},  this.props), this.props.children)
        );
    }
});
