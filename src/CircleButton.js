import React from 'react'
import './styles/circle-menu-buttons.scss!'

export default class CircleButton extends React.Component {
    constructor(props) {
        super(props)
    }

    handleClick = () => {
        this.props.handleClick();
    }

    render() {
        return (
            <div className="container__body" style={this.props.btnStyles}>
                <div className="btn__container">
                    <div className="btn-wrapper">
                        <a href="#" className="btn" onClick={this.handleClick}>
                            <small className={this.props.icons}></small>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
