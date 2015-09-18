var Polyline = React.createClass({
    render: function() {
        return <polyline {...this.props}>{this.props.children}</polyline>;
    }
})
