(function() {

    var App = React.createClass({displayName: "App",

        getInitialState: function() {
            var size = 100;
            return ({
                centerDot: 0,
                crossSize: size,
                crossSpread: 0,
                crossLength: 0,
                dotDiameter: 10,
                strokeWidth: 1,
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

        render: function() {
            return (
                React.createElement("div", {className: "container"}, 
                    React.createElement(Menu, {
                        changeDot: this.handleDotChange, 
                        changeSpread: this.handleSpreadChange, 
                        changeLength: this.handleLengthChange, 
                        changeSize: this.handleSizeChange, 
                        changeDotDiam: this.handleDotDiam, 
                        changeStrokeWidth: this.handleStrokeWidth, 

                        crossSize: this.state.crossSize, 
                        crossSpread: this.state.crossSpread, 
                        crossLength: this.state.crossLength, 
                        dotDiameter: this.state.dotDiameter, 
                        strokeWidth: this.state.strokeWidth}), 
                    React.createElement(CrossHair, {
                        centerDot: this.state.centerDot, 
                        height: this.state.crossSize, 
                        width: this.state.crossSize, 
                        crossSpread: this.state.crossSpread, 
                        crossLength: this.state.crossLength, 
                        dotDiameter: this.state.dotDiameter, 
                        strokeWidth: this.state.strokeWidth, 
                        viewBox: "0 0 100 100"})
                )
            );
        }
    });

    React.render(
        React.createElement(App, null)
    , document.getElementById('crosshair') );

}());
