var Polyline = React.createClass({displayName: "Polyline",
    render: function() {
        return React.createElement("polyline", React.__spread({},  this.props), this.props.children);
    }
})
