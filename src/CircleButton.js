import React from 'react'
import './styles/circle-menu-buttons.scss!'

export default class CircleButton extends React.Component {
    constructor(props) {
        super(props)
    }

    handleClick = () => {
        this.props.handleClick()
    }

    render() {
        const buttonStyles = this.props.btnStyles;

        return (
            <div className="container__body" style={buttonStyles}>
                <div className="btn__container">
                    <div className="btn-wrapper">
                        <a href="#" className="btn" onClick={this.handleClick}>
                            <small className={this.props.icons}></small>
                        </a>
                    </div>
                </div>
            </div>
        )
    }
}
                            // <small className="icon icon-rss icon--grey"></small>
            // <div style={buttonStyles} id={'round-menu-button-container'}>
            //
            // </div>
            // <g>
            //     <defs>
            //
            //         <clipPath id="Clip">
            //             <rect x="0" y="0" stroke="#000000" strokeMiterlimit="10" width="40" height="40" />
            //             <rect x="60" y="0" stroke="#000000" strokeMiterlimit="10" width="40" height="40" />
            //             <rect x="0" y="60" stroke="#000000" strokeMiterlimit="10" width="40" height="40" />
            //             <rect x="60" y="60" stroke="#000000" strokeMiterlimit="10" width="40" height="40" />
            //         </clipPath>
            //     </defs>
            //
            //     <circle style={this.props.backgroundStyles} cx="50" cy="50" r="35" fill={this.props.fill} />
            //     <circle style={buttonStyles} cx="50" cy="50" r="40"/>
            // </g>
