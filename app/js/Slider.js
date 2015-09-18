var Slider = React.createClass({displayName: "Slider",
    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("input", {type: "range"})
            )
        );
    }
});
