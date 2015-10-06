import React from 'react';
import CircleButton from './CircleButton';

export default class CircleButtonGroup extends React.Component {

    static propTypes = {};

    static defaultProps = {};

    state = {};

    constructor(props) {
        super(props)
        this.backgroundImg = {src: './src/images/button_background.svg'};
    }

    componentWillMount() {}

    componentDidMount() {}

    componentWillUnMount() {}

    closeApp = () => {
        overwolf.windows.obtainDeclaredWindow("MenuWindow", result => {
                if (result.status == "success"){
                    overwolf.windows.close(result.window.id, () => {})
                }
            }
        );
    }

    minimizeMenu = () => {
        overwolf.windows.obtainDeclaredWindow("MenuWindow", result => {
                if (result.status == "success"){
                    overwolf.windows.minimize(result.window.id, () => {})
                }
            }
        );
    }

    render() {

        // Styles for the button background svg
        const bgStyles = {
            // zIndex: 90,
            position: 'absolute',
            top: '-93px',
            left: '-150px',
            transform:'rotate(180deg)',
            width: '100px'
        }

        // positioning of top button
        const btn1Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-80px',
            left: '-103px'
        }
        const btn1Icons = 'icon icon-paint icon--grey'

        // positioning of middle button
        const btn2Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-14px',
            left: '-147px'
        }
        const btn2Icons = 'icon icon-sliders icon--grey';

        // positioning of bottom button
        const btn3Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '50px',
            left: '-103px'
        };

        const closeButton = {
            position: 'absolute',
            left: '-135px',
            top: '-65px',
        };

        const miniButton = {
            position: 'absolute',
            left: '-160px',
            top: '-65px',
        };

        const btn3Icons = 'icon icon-gear icon--grey';


        return (
            <div key="graphicalMenu">
                {/* Buttons */}
                {/* Toggle Color Pickers */}
                <CircleButton
                    handleClick={this.props.toggleColorPickers}
                    icons={btn1Icons}
                    btnStyles={btn1Styles} />

                {/* Toggle Sliders */}
                <CircleButton
                    handleClick={this.props.toggleSliders}
                    icons={btn2Icons}
                    btnStyles={btn2Styles} />

                {/* !!! Unused Button !!! */}
                <CircleButton
                    handleClick={this.props.handleDot}
                    icons={btn3Icons}
                    btnStyles={btn3Styles} />

                <div style={closeButton} className="sm-btn__container">
                    <div className="btn-wrapper">
                        <a href="#" className="btn" onClick={this.closeApp}>
                            <i className="fa fa-power-off sm-icon"></i>
                        </a>
                    </div>
                </div>

                <div style={miniButton} className="sm-btn__container">
                    <div className="btn-wrapper">
                        <a href="#" className="btn" onClick={this.minimizeMenu}>
                            <i className="fa fa-minus sm-icon"></i>
                        </a>
                    </div>
                </div>

                {/* Button background image */}
                {/* <img style={bgStyles} src={this.backgroundImg.src} /> */}
            </div>
        );
    }
}
