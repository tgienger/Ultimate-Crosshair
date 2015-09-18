var Circle = React.createClass({
    render: function() {
        return (
            <circle {...this.props}>{this.props.children}</circle>
        );
    }
});
