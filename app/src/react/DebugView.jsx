import React from 'react';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import {sculptureStore} from '../stores';
import Sprites from './svg/status-sprites.svg';

const COLORS = {
  SEARCHING: 'yellow',
  OK: 'green',
  FAILED: 'red',
};

const symbols = {
  master: { states: ['master'] },
};

const toColor = (bool) => typeof bool !== 'boolean' ? COLORS.SEARCHING : bool ? COLORS.OK : COLORS.FAILED;

export default class DebugView extends React.Component {
  static propTypes = {
    scale: React.PropTypes.number,
    translate: React.PropTypes.arrayOf(React.PropTypes.number),
    rotate: React.PropTypes.number,
  };
  static defaultProps = {
    scale: 1,
    translate: [0, 0],
    rotate: 0,
  };

  constructor(props) {
    super(props);
    this.state = {
      master: toColor(false),
      status: '',
    };
  }

  componentWillMount() {
    sculptureStore.on(SculptureStore.EVENT_LOCAL_CHANGE, this._handleLocalChanges.bind(this));
    sculptureStore.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
  }

  componentWillUnmount() {
    // FIXME: this.props.app.removeListener() ?
  }

  _handleLocalChanges() {
    this.setState({
      master: toColor(sculptureStore.isMaster())
    });
  }

  _handleChanges() {
    this.setState({
      status: sculptureStore.getStatus()
    });
  }

  colorFromStates(states) {
    let ret = COLORS.OK;
    for (let state of states) {
      if (this.state[state] === COLORS.FAILED) return COLORS.FAILED;
      if (this.state[state] === COLORS.SEARCHING) ret = COLORS.SEARCHING;
    }
    return ret;
  }

  renderIcons() {
    const numIcons = Object.keys(symbols).length;
    const startAngle = -(numIcons-1)/2 * 8 * Math.PI / 180;
    const stepAngle = 8 * Math.PI / 180;
    return Object.keys(symbols).map((key, idx) => {
      const col = this.colorFromStates(symbols[key].states);

      const angle = startAngle + idx * stepAngle;
      const radius = 10;
      const offset = 0;
      const xpos = Math.cos(angle)*(350 + offset);
      const ypos = Math.sin(angle)*(350 + offset);
      return <g key={key} className={`status-icon ${col}-status`} transform={`translate(${xpos}, ${ypos})`}>
          <use x={-radius} y={-radius} width={radius*2} height={radius*2} xlinkHref={`#${key}`}/>
      </g>;
    });
  }

  renderStatus(status) {
    const transform = `translate(320, 0) rotate(90)`;
    const fontSize = 15;
    return <g transform={transform}>
      <text x="0" y="0" fontSize={fontSize} textAnchor="middle" alignmentBaseline="middle" fill="#ffffff">
        {status}
      </text>
    </g>;
  }

  render() {
    return <svg id="debug-view" viewBox="0 0 700 700" style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      right: 0,
      top: 0,
      zIndex: 10,
    }}>
      <g display="none"><Sprites/></g>
      <g style={{transform: "translate(350px, 350px) rotate(0deg)"}}>
        <g style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale}) rotate(${this.props.rotate + 50}deg)`}}>
          {this.renderIcons()}
          {this.renderStatus(this.state.status)}
        </g>
      </g>
    </svg>;
  }
}
