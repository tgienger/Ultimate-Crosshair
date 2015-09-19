import React from 'react';

export default class Rectangle extends React.Component {
    render() {
        return (
            <rect {...this.props}>{this.props.children}</rect>
        );
    }
}
