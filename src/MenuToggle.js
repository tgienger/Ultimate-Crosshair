import React from 'react';

export default class MenuToggle extends React.Component {

    handleClick = () => {
        this.props.handleClick()
    }

    render() {

        const styles = {
            zIndex: 200,
            position: 'absolute',
            top: this.props.top,
            left: this.props.left
        }

        return (
            <div id={'menu-toggle'}>
                <button style={styles} onClick={this.handleClick}>Show Menu</button>
            </div>
        )
    }
}
