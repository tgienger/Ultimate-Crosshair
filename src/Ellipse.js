import React from 'react';

export default class Ellipse extends React.Component {
    render() {
        return (
            <ellipse {...this.props}>{this.props.children}</ellipse>
        );
    }
}
