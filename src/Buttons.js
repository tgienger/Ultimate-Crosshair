import React from 'react';

export default class Buttons extends React.Component {
    constructor() {
        super()
    }

    handleToggles = (type) => {
        this.props.handleToggles(type)
    }

    handleDot = () => {
        this.props.handleDot()
    }

    handleClick = () => {
        this.props.handleOpenClick()
    }

    render() {
        return (
            <ul>
                <li><a href="#" onClick={this.handleToggles.bind(this, 'showColorPicker')}>Color Selector</a></li>
                <li><a href="#">Menu Item</a></li>
                <li><a href="#" onClick={this.handleClick}>Slider Menu</a></li>
                <li><a href="#" onClick={this.handleDot}>Center Dot</a></li>
            </ul>
        );
    }
}
