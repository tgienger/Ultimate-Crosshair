var Line = React.createClass({displayName: "Line",
    render: function() {
        return React.createElement("line", React.__spread({},  this.props), this.props.children)
    }
})
