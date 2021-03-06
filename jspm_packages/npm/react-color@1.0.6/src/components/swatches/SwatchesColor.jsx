'use strict';

var React = require('react');
var ReactCSS = require('reactcss');

class SwatchesColor extends ReactCSS.Component {

  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);
  }

  classes() {
    return {
      'default': {
        color: {
          width: '40px',
          height: '24px',
          cursor: 'pointer',
          background: this.props.color,
          marginBottom: '1px',
        },
        check: {
          fill: '#fff',
          marginLeft: '8px',
          display: 'none',
        },
      },
      'first': {
        color: {
          overflow: 'hidden',
          borderRadius: '2px 2px 0 0',
        },
      },
      'last': {
        color: {
          overflow: 'hidden',
          borderRadius: '0 0 2px 2px',
        },
      },
      active: {
        check: {
          display: 'block',
        },
      },
    };
  }

  handleClick() {
    this.props.onClick(this.props.color);
  }

  render() {
    return (
      <div is="color" onClick={ this.handleClick }>
        <div is="check">
          <svg style={{ width:'24px', height:'24px', }} viewBox="0 0 24 24">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
          </svg>
        </div>
      </div>
    );
  }

}

module.exports = SwatchesColor;
