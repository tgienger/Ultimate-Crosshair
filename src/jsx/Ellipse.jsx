var Ellipse = React.createClass({
    render: function() {
        return (
            <ellipse {...this.props}>{this.props.children}</ellipse>
        );
    }
});
