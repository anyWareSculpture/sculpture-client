import React from 'react';
import SculptureApp from '../app';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;
import config from '../config';
import InitStore from '../init-store';
import {initStore} from '../stores';
import Sprites from './svg/status-sprites.svg';

const COLORS = {
  SEARCHING: 'yellow',
  OK: 'green',
  FAILED: 'red',
};

const manifest = chrome.runtime.getManifest();

const symbols = {
  a: { states: ['STRIP_A'] },
  b: { states: ['STRIP_B'] },
  c: { states: ['STRIP_C'] },
  mega: { states: ['RGB_STRIPS', 'HANDSHAKE_STRIP', 'ART_LIGHTS_STRIP', SerialProtocol.HANDSHAKE_COMMAND] },
  network: { states: ['clientConnected'] },
  sound: { states: ['audioInitialized'] },
  serial: { states: ['serialInitialized'] },
};

const toColor = (bool) => bool == null ? 'yellow' : bool ? 'green' : 'red';

export default class StatusView extends React.Component {
  static propTypes = {
    scale: React.PropTypes.number,
    translate: React.PropTypes.arrayOf(React.PropTypes.number),
    debug: React.PropTypes.bool,
  };
  static defaultProps = {
    scale: 1,
    translate: [0, 0],
  };

  constructor(props) {
    super(props);
    this.state = this.getInitStoreState();
  }

  getInitStoreState() {
    const state = {
      ready: initStore.ready,
      sculptureId: initStore.sculptureId,
      audioInitialized: toColor(initStore.audioInitialized),
      clientConnected: toColor(initStore.clientConnected),
      serialInitialized: toColor(initStore.serialInitialized),
    };
    const systemState = initStore.systemState;
    Object.keys(systemState).forEach((system) => {
      state[system] = toColor(systemState[system]);
    });
    return state;
  }

  componentWillMount() {
    initStore.on(InitStore.EVENT_CHANGE, () => {
      this.setState(this.getInitStoreState());
    });
  }

  componentWillUnmount() {
    // FIXME: this.props.app.removeListener() ?
  }

  colorFromStates(states) {
    let ret = COLORS.OK;
    for (let state of states) {
      if (this.state[state] === COLORS.FAILED) return COLORS.FAILED;
      if (this.state[state] === COLORS.SEARCHING) ret = COLORS.SEARCHING;
    }
    return ret;
  }

  renderIcons(isReady) {
    if (isReady && !this.props.debug) return null;
    const numIcons = Object.keys(symbols).length;
    const startAngle = isReady ? (-(numIcons-1)/2 * 8 * Math.PI / 180) : 0;
    const stepAngle = isReady ? (8 * Math.PI / 180) : (2 * Math.PI / numIcons);
    return Object.keys(symbols).map((key, idx) => {
      const col = this.colorFromStates(symbols[key].states);

      const angle = startAngle + idx * stepAngle;
      const radius = isReady ? 10 : 70;
      const offset = isReady ? 0 : (-2 * radius);
      const xpos = Math.cos(angle)*(350 + offset);
      const ypos = Math.sin(angle)*(350 + offset);
      return <g key={key} className={`status-icon ${col}-status`} transform={`translate(${xpos}, ${ypos})`}>
          <use x={-radius} y={-radius} width={radius*2} height={radius*2} xlinkHref={`#${key}`}/>
      </g>;
    });
  }

  renderSculptureId(isReady) {
    if (isReady && !this.props.debug) return null;

    let transform = '';
    let fontSize = 30;
    if (isReady) {
      transform = `translate(320, 0) rotate(90)`;
      fontSize = 15;
    }
    return <g transform={transform}>
      <text x="0" y="0" fontSize={fontSize} textAnchor="middle" alignmentBaseline="middle" fill="#ffffff">
        {this.state.sculptureId}
      </text>
    </g>;
  }

  renderVersion(isReady) {
    if (isReady) return null;

    return <g transform={'translate(0,50)'}>
      <text x="0" y="0" fontSize={30} textAnchor="middle" alignmentBaseline="middle" fill="#ffffff">
        {`V${manifest.version}`}
      </text>
    </g>;
  }

  render() {
    return <svg id="status-view" viewBox="0 0 700 700" style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      right: 0,
      top: 0,
      zIndex: 10,
    }}>
      <g display="none"><Sprites/></g>
      <g style={{transform: "translate(350px, 350px) rotate(35deg)"}}>
        <g className="" style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale})`}}>
          {this.renderIcons(this.state.ready)}
          {this.renderSculptureId(this.state.ready)}
          {this.renderVersion(this.state.ready)}
        </g>
      </g>
    </svg>;
  }
}
