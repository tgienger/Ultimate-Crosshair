import React from 'react';

export default class Circle extends React.Component {
    render() {
        return (
            <circle {...this.props}>{this.props.children}</circle>
        )
    }
}
