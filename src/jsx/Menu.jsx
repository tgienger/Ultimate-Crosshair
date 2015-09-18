var Menu = React.createClass({

    handleClick: function() {
        console.log("CLICKED");
    },

    changeDot: function() {
        this.props.changeDot();
    },

    openSliders: function() {
        console.log('changihng ')
    },

    handleSizeChange: function() {
        var value = React.findDOMNode(this.refs.crossSize).value;
        this.props.changeSize(value);
    },

    handleSpreadChange: function() {
        var value = React.findDOMNode(this.refs.crossSpread).value;
        this.props.changeSpread(value);
    },

    handleLengthChange: function() {
        var value = React.findDOMNode(this.refs.crossLength).value;
        this.props.changeLength(value);
    },

    handleDiameterChange: function() {
        var value = React.findDOMNode(this.refs.dotDiameter).value;
        this.props.changeDotDiam(value);
    },

    handleStrokeChange: function() {
        var value = React.findDOMNode(this.refs.strokeWidth).value;
        this.props.changeStrokeWidth(value);
    },

    render: function() {
        return (
            <div id="menu" className="menu">
                <ul>
                    <li><a href="#" onClick={this.handleClick}>Menu Item</a></li>
                    <li><a href="#">Menu Item</a></li>
                    <li><a href="#">Menu Item</a></li>
                    <li><a href="#" onClick={this.openSliders}>Size Slider</a></li>
                    <li><a href="#" onClick={this.changeDot}>Center Dot</a></li>
                </ul>
                <div className="sliders">
                    <label for="cross-size">CrossHair Size</label>
                    <input
                        type="range"
                        id="cross-size"
                        min="15"
                        max="150"
                        step="1"
                        value={this.props.crossSize}
                        onInput={this.handleSizeChange}
                        onChange={this.handleSizeChange}
                        ref="crossSize" />


                    <label for="cross-spread">Spread</label>
                    <input
                        type="range"
                        id="cross-spread"
                        min="0"
                        max="50"
                        step="1"
                        value={this.props.crossSpread}
                        onInput={this.handleSpreadChange}
                        onChange={this.handleSpreadChange}
                        ref="crossSpread" />


                    <label for="cross-length">Length</label>
                    <input
                        type="range"
                        id="cross-length"
                        min="0"
                        max="50"
                        step="1"
                        value={this.props.crossLength}
                        onInput={this.handleLengthChange}
                        onChange={this.handleLengthChange}
                        ref="crossLength" />

                    <label for="cross-stroke">Stroke Width</label>
                    <input
                        type="range"
                        id="dot-diameter"
                        min="1"
                        max="10"
                        step="1"
                        value={this.props.strokeWidth}
                        onInput={this.handleStrokeChange}
                        onChange={this.handleStrokeChange}
                        ref="strokeWidth" />

                    <label for="dot-diameter">Dot Diameter</label>
                    <input
                        type="range"
                        id="dot-diameter"
                        min="0"
                        max="20"
                        step="1"
                        value={this.props.dotDiameter}
                        onInput={this.handleDiameterChange}
                        onChange={this.handleDiameterChange}
                        ref="dotDiameter" />
                </div>
            </div>
        )
    }
});
