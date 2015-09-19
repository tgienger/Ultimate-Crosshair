import React from 'react';
import Menu from './Menu';
import CrossHair from './CrossHair';

export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            centerDot: 0,
            crossSize: 100,
            crossSpread: 0,
            crossLength: 0,
            crossColor: "rgba(0, 255, 0, 1)",
            dotDiameter: 10,
            strokeWidth: 1,
            spinning: false,
            opacity: 1,
            color: 0
        }
        this.handleState = this.handleState.bind(this);
        this.handleDot = this.handleDot.bind(this);
    }

    handleDot() {
        var n = this.state.centerDot + 1;
        this.setState({
            centerDot: n < 3 ? n : 0
        });
    }

    handleState(state, value) {
        var newState = {};
        newState[state] = value;
        this.setState(newState);
    }

    render() {
        return (
            <div className="container">
                <Menu
                    /* Event Handlers */
                    changeDot={this.handleDot}
                    handleChange={this.handleState}

                    /* Props */
                    crossSize={this.state.crossSize}
                    crossSpread={this.state.crossSpread}
                    crossLength={this.state.crossLength}
                    dotDiameter={this.state.dotDiameter}
                    strokeWidth={this.state.strokeWidth}
                    opacity={this.state.opacity}
                    spinning={this.state.spinning}
                    crossColor={this.state.crossColor} />

                <CrossHair
                    centerDot={this.state.centerDot}
                    height={this.state.crossSize}
                    width={this.state.crossSize}
                    crossSpread={this.state.crossSpread}
                    crossLength={this.state.crossLength}
                    dotDiameter={this.state.dotDiameter}
                    strokeWidth={this.state.strokeWidth}
                    opacity={this.state.opacity}
                    spinning={this.state.spinning}
                    crossColor={this.state.crossColor}
                    viewBox="0 0 100 100" />
            </div>
        );
    }
}


// <CrossHair
//     centerDot={this.state.centerDot}
//     height={this.state.crossSize}
//     width={this.state.crossSize}
//     crossSpread={this.state.crossSpread}
//     crossLength={this.state.crossLength}
//     dotDiameter={this.state.dotDiameter}
//     strokeWidth={this.state.strokeWidth}
//     opacity={this.state.opacity}
//     spinning={this.state.spinning}
//     viewBox="0 0 100 100" />


    // var App = React.createClass({
    //
    //
    //     handleDotChange: function() {
    //         var n = this.state.centerDot + 1;
    //         this.setState({
    //             centerDot: n < 3 ? n : 0
    //         });
    //     },
    //
    //     handleSizeChange: function(size) {
    //         this.setState({
    //             crossSize: size
    //         });
    //     },
    //
    //     handleSpreadChange: function(size) {
    //         this.setState({
    //             crossSpread: size
    //         });
    //     },
    //
    //     handleLengthChange: function(size) {
    //         this.setState({
    //             crossLength: size
    //         });
    //     },
    //
    //     handleDotDiam: function(size) {
    //         this.setState({
    //             dotDiameter: size
    //         });
    //     },
    //
    //     handleStrokeWidth: function(size) {
    //         this.setState({
    //             strokeWidth: size
    //         });
    //     },
    //
    //     handleOpacity: function(val) {
    //         this.setState({
    //             opacity: val
    //         });
    //     },
    //
    //     handleSpin: function(tween) {
    //         //tween.restart();
    //         if (this.state.spinning) {
    //             this.setState({
    //                 spinning: false
    //             })
    //         } else {
    //             this.setState({
    //                 spinning: true
    //             })
    //             // var tween = TweenMax.to('#crosshair', 1, {rotation: 360, repeat: -1, ease:Linear.easeNone});
    //         }
    //     },
    //
    //     render: function() {

    //     }
    // });
    //
