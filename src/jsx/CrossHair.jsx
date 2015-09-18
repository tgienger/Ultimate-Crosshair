var CrossHair = React.createClass({
    render: function() {
        return (
            <div id="crosshair-bounding-box">
                <SVGComponent {...this.props}>
                    <Cross
                        crossSpread={this.props.crossSpread}
                        crossLength={this.props.crossLength}
                        strokeWidth={this.props.strokeWidth} />

                    <Centerdot {...this.props}/>
                </SVGComponent>
            </div>
        );
    }
})
