var Menu = React.createClass({displayName: "Menu",

    handleClick: function() {
        console.log("CLICKED");
    },

    changeDot: function() {
        this.props.changeDot();
    },

    openSliders: function() {
        console.log('changihng ')
    },

    handleSizeChange: function() {
        var value = React.findDOMNode(this.refs.crossSize).value;
        this.props.changeSize(value);
    },

    handleSpreadChange: function() {
        var value = React.findDOMNode(this.refs.crossSpread).value;
        this.props.changeSpread(value);
    },

    handleLengthChange: function() {
        var value = React.findDOMNode(this.refs.crossLength).value;
        this.props.changeLength(value);
    },

    handleDiameterChange: function() {
        var value = React.findDOMNode(this.refs.dotDiameter).value;
        this.props.changeDotDiam(value);
    },

    handleStrokeChange: function() {
        var value = React.findDOMNode(this.refs.strokeWidth).value;
        this.props.changeStrokeWidth(value);
    },

    render: function() {
        return (
            React.createElement("div", {id: "menu", className: "menu"}, 
                React.createElement("ul", null, 
                    React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.handleClick}, "Menu Item")), 
                    React.createElement("li", null, React.createElement("a", {href: "#"}, "Menu Item")), 
                    React.createElement("li", null, React.createElement("a", {href: "#"}, "Menu Item")), 
                    React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.openSliders}, "Size Slider")), 
                    React.createElement("li", null, React.createElement("a", {href: "#", onClick: this.changeDot}, "Center Dot"))
                ), 
                React.createElement("div", {className: "sliders"}, 
                    React.createElement("label", {for: "cross-size"}, "CrossHair Size"), 
                    React.createElement("input", {
                        type: "range", 
                        id: "cross-size", 
                        min: "15", 
                        max: "150", 
                        step: "1", 
                        value: this.props.crossSize, 
                        onInput: this.handleSizeChange, 
                        onChange: this.handleSizeChange, 
                        ref: "crossSize"}), 


                    React.createElement("label", {for: "cross-spread"}, "Spread"), 
                    React.createElement("input", {
                        type: "range", 
                        id: "cross-spread", 
                        min: "0", 
                        max: "50", 
                        step: "1", 
                        value: this.props.crossSpread, 
                        onInput: this.handleSpreadChange, 
                        onChange: this.handleSpreadChange, 
                        ref: "crossSpread"}), 


                    React.createElement("label", {for: "cross-length"}, "Length"), 
                    React.createElement("input", {
                        type: "range", 
                        id: "cross-length", 
                        min: "0", 
                        max: "50", 
                        step: "1", 
                        value: this.props.crossLength, 
                        onInput: this.handleLengthChange, 
                        onChange: this.handleLengthChange, 
                        ref: "crossLength"}), 

                    React.createElement("label", {for: "cross-stroke"}, "Stroke Width"), 
                    React.createElement("input", {
                        type: "range", 
                        id: "dot-diameter", 
                        min: "1", 
                        max: "10", 
                        step: "1", 
                        value: this.props.strokeWidth, 
                        onInput: this.handleStrokeChange, 
                        onChange: this.handleStrokeChange, 
                        ref: "strokeWidth"}), 

                    React.createElement("label", {for: "dot-diameter"}, "Dot Diameter"), 
                    React.createElement("input", {
                        type: "range", 
                        id: "dot-diameter", 
                        min: "0", 
                        max: "20", 
                        step: "1", 
                        value: this.props.dotDiameter, 
                        onInput: this.handleDiameterChange, 
                        onChange: this.handleDiameterChange, 
                        ref: "dotDiameter"})
                )
            )
        )
    }
});
