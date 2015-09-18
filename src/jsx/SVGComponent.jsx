var SVGComponent = React.createClass({
    render: function() {
        return (
            <svg {...this.props}>{this.props.children}</svg>
        );
    }
});
