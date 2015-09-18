var Rectangle = React.createClass({
    render: function() {
        return (
            <rect {...this.props}>{this.props.children}</rect>
        );
    }
});
