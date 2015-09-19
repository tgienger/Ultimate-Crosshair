import React from 'react';
import Slider from './Slider';
import ColorPicker from 'react-color';

export default class Menu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showSliders: false,
            showColorPicker: false
        };

        this.handleSpin = this.handleSpin.bind(this);
        this.changeDot = this.changeDot.bind(this);
        this.toggleSliders = this.toggleSliders.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.toggleColor = this.toggleColor.bind(this);
        this.handleCrossColor = this.handleCrossColor.bind(this);
        this.handleColorClose = this.handleColorClose.bind(this);
    }

    handleSpin() {
        this.props.handleSpin(this.tween);
    }

    changeDot() {
        this.props.changeDot();
    }

    toggleColor() {
        this.setState({
            showColorPicker: !this.state.showColorPicker
        });
    }

    handleColorClose() {
        this.setState({
            showColorPicker: false
        });
    }

    handleCrossColor(color) {
        var newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
        this.props.handleChange('crossColor', newColor);
    }

    toggleSliders() {
        this.setState({
            showSliders: !this.state.showSliders
        });
    }

    handleChange(state, val) {
        this.props.handleChange(state, val);
    }

    render() {
        //TODO: implement slide menu toggle
        return (
            <div id="menu" className="menu">

                {/* Color Picker */}
                <ColorPicker
                    type="chrome"
                    color={this.props.crossColor}
                    display={this.state.showColorPicker}
                    onChange={this.handleCrossColor}
                    onClose={this.handleColorClose} />

                <ul>
                    <li><a href="#" onClick={this.toggleColor}>Color Selector</a></li>
                    <li><a href="#">Menu Item</a></li>
                    <li><a href="#" onClick={this.toggleSliders}>Slider Menu</a></li>
                    <li><a href="#" onClick={this.changeDot}>Center Dot</a></li>
                </ul>


                <div className="sliders">

                    <Slider
                        id="cross-size"
                        labelName="Cross Hair Size"
                        min="15"
                        max="150"
                        step="1"
                        value={this.props.crossSize}
                        updateSlider={this.handleChange.bind(this, 'crossSize')} />

                    <Slider
                        id="cross-spread"
                        labelName="Spread"
                        min="0"
                        max="50"
                        step="1"
                        value={this.props.crossSpread}
                        updateSlider={this.handleChange.bind(this, 'crossSpread')} />

                    <Slider
                        id="cross-length"
                        labelName="Length"
                        min="-50"
                        max="0"
                        step="1"
                        value={this.props.crossLength}
                        updateSlider={this.handleChange.bind(this, 'crossLength')} />

                    <Slider
                        id="dot-diameter"
                        labelName="Dot Diameter"
                        min="0"
                        max="20"
                        step="1"
                        value={this.props.dotDiameter}
                        updateSlider={this.handleChange.bind(this, 'dotDiameter')} />

                    <Slider
                        id="cross-stroke"
                        labelName="Thickness"
                        min="1"
                        max="10"
                        step="1"
                        value={this.props.strokeWidth}
                        updateSlider={this.handleChange.bind(this, 'strokeWidth')} />

                    <Slider
                        id="opacity"
                        labelName="Opacity"
                        min="0"
                        max="1"
                        step=".01"
                        value={this.props.opacity}
                        updateSlider={this.handleChange.bind(this, 'opacity')} />

                </div>
            </div>
        )
    }
}
