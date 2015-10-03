import React from 'react';
import Slider from './Slider';

export default class Sliders extends React.Component {
    constructor() {
        super();
    }

    handleChange = (state, val) => {
        this.props.handleChange(state, val);
    }

    render() {
        return (
            <div className={"sliders"}>

                <Slider
                    id="cross-size"
                    className="slider-child"
                    labelName="Cross Hair Size"
                    min="15"
                    max="150"
                    step="1"
                    value={this.props.crossSize}
                    updateSlider={this.handleChange.bind(this, 'crossSize')} />

                <Slider
                    id="cross-spread"
                    className="slider-child"
                    labelName="Spread"
                    min="0"
                    max="50"
                    step="1"
                    value={this.props.crossSpread}
                    updateSlider={this.handleChange.bind(this, 'crossSpread')} />

                <Slider
                    id="cross-length"
                    className="slider-child"
                    labelName="Length"
                    min="-50"
                    max="0"
                    step="1"
                    value={this.props.crossLength}
                    updateSlider={this.handleChange.bind(this, 'crossLength')} />

                <Slider
                    id="dot-diameter"
                    className="slider-child"
                    labelName="Dot Size"
                    min="0"
                    max="20"
                    step="1"
                    value={this.props.dotDiameter}
                    updateSlider={this.handleChange.bind(this, 'dotDiameter')} />

                <Slider
                    id="cross-stroke"
                    className="slider-child"
                    labelName="Thickness"
                    min="1"
                    max="10"
                    step="1"
                    value={this.props.strokeWidth}
                    updateSlider={this.handleChange.bind(this, 'strokeWidth')} />

                <Slider
                    id="opacity"
                    className="slider-child"
                    labelName="Opacity"
                    min="0"
                    max="1"
                    step=".01"
                    value={this.props.opacity}
                    updateSlider={this.handleChange.bind(this, 'opacity')} />

            </div>
        );
    }
}
