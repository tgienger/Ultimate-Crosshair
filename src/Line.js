import React from 'react';

export default class Line extends React.Component {
    render() {
        return <line {...this.props}>{this.props.children}</line>
    }
}
