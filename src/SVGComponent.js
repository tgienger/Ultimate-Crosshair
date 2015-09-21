import React from 'react';

export default class SVGComponent extends React.Component {
    render() {
        return (
            <svg
                id={this.props.id}
                height={this.props.height}
                width={this.props.width}
                opacity={this.props.opacity}
                viewBox={this.props.viewBox}>{this.props.children}</svg>
        );
    }
}
