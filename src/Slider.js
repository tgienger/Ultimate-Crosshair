import React from 'react';

export default class Slider extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
    }

    componentWillUnMount() {
        // this.sliderAnim.tweenTo('collapse');
    }

    handleChange = (e) => {
        this.props.updateSlider(e.target.value);
    }

    render() {
        const styles = {
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontWeight: 'bold',
            border: '1px solid rgb(190, 190, 190)',
            borderRadius: '3px',
            width: '215px',
            display: 'block',
            padding: '5px',
            marginBottom: '3px'
        }
        return (
            <div style={styles} key="mainSlider">
                <label for={this.props.id}>{this.props.labelName}</label>
                <input
                    className="slider-children"
                    type="range"
                    id={this.props.id}
                    min={this.props.min}
                    max={this.props.max}
                    step={this.props.step}
                    value={this.props.value}
                    onInput={this.handleChange}
                    onChange={this.handleChange} />
            </div>
        )
    }
}
