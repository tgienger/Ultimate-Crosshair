import React from 'react'
import SVGComponent from './SVGComponent'
import CircleButton from './CircleButton'
import backgroundImg from './images/button_background.svg!image'

export default class CircleMenu extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            backgroundStyles: {
                display: 'none'
            }
        }
    }

    render() {

        const containerStyles = {
            position: 'relative'
        }
        const bgStyles = {
            // zIndex: 90,
            position: 'absolute',
            top: '-93px',
            left: '-150px',
            transform:'rotate(180deg)'
        }
        const btn1Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-90px',
            left: '-103px'
        }
        const btn2Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '40px',
            left: '-103px'
        }
        const btn3Styles = {
            zIndex: 9999,
            position: 'absolute',
            top: '-24px',
            left: '-147px'
        }

        return (
            <div className={'container2'}>
                <div style={containerStyles}>
                    <CircleButton
                        btnStyles={btn1Styles} />
                    <CircleButton
                        btnStyles={btn2Styles} />
                    <CircleButton
                        btnStyles={btn3Styles} />
                    <img style={bgStyles} width="100px" src={backgroundImg.src} />
                </div>
            </div>
        )
    }
}
