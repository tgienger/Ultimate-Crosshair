(function() {

    var App = React.createClass({

        getInitialState: function() {
            this.spinning = false;
            var size = 100;
            return ({
                centerDot: 0,
                crossSize: size,
                crossSpread: 0,
                crossLength: 0,
                dotDiameter: 10,
                strokeWidth: 1,
                opacity: 1,
                color: 0
            });
        },

        handleDotChange: function() {
            var n = this.state.centerDot + 1;
            this.setState({
                centerDot: n < 3 ? n : 0
            });
        },

        handleSizeChange: function(size) {
            this.setState({
                crossSize: size
            });
        },

        handleSpreadChange: function(size) {
            this.setState({
                crossSpread: size
            });
        },

        handleLengthChange: function(size) {
            this.setState({
                crossLength: size
            });
        },

        handleDotDiam: function(size) {
            this.setState({
                dotDiameter: size
            });
        },

        handleStrokeWidth: function(size) {
            this.setState({
                strokeWidth: size
            });
        },
        
        handleOpacity: function(val) {
            this.setState({
                opacity: val
            });
        },
        
        handleSpin: function(tween) {
            //tween.restart();
            if (this.spinning) {
                tween.kill();
            } else {
                this.spinning = true;
                var tween = TweenMax.to('#crosshair', 1, {rotation: 360, repeat: -1, ease:Linear.easeNone});
            }
        },

        render: function() {
            return (
                <div className="container">
                    <Menu
                        changeDot={this.handleDotChange}
                        changeSpread={this.handleSpreadChange}
                        changeLength={this.handleLengthChange}
                        changeSize={this.handleSizeChange}
                        changeDotDiam={this.handleDotDiam}
                        changeStrokeWidth={this.handleStrokeWidth}
                        changeOpacity={this.handleOpacity}
                        handleSpin={this.handleSpin}

                        crossSize={this.state.crossSize}
                        crossSpread={this.state.crossSpread}
                        crossLength={this.state.crossLength}
                        dotDiameter={this.state.dotDiameter}
                        strokeWidth={this.state.strokeWidth}
                        opacity={this.state.opacity} />
                        
                    <CrossHair
                        centerDot={this.state.centerDot}
                        height={this.state.crossSize}
                        width={this.state.crossSize}
                        crossSpread={this.state.crossSpread}
                        crossLength={this.state.crossLength}
                        dotDiameter={this.state.dotDiameter}
                        strokeWidth={this.state.strokeWidth}
                        opacity={this.state.opacity}
                        viewBox="0 0 100 100" />
                </div>
            );
        }
    });

    React.render(
        <App />
    , document.getElementById('main-app') );

}());
