import React from 'react';

export default class SVGComponent extends React.Component {
    render() {
        return (
            <svg {...this.props}>{this.props.children}</svg>
        );
    }
}
