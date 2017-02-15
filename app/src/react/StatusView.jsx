import React from 'react';
import SculptureApp from '../app';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;
import config from '../config';
import InitStore from '../init-store';
import {initStore} from '../stores';

const manifest = chrome.runtime.getManifest();

const symbolMap = {
  STRIP_A: 'A',
  STRIP_B: 'B',
  STRIP_C: 'C',
  RGB_STRIPS: 'R',
  HANDSHAKE_STRIP: 'H',
  ART_LIGHTS_STRIP: 'P',
  [SerialProtocol.HANDSHAKE_COMMAND]: 'V',
  clientConnected: 'N',
  audioInitialized: 'S',
  serialInitialized: 's'
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

  renderIcons(isReady) {
    if (isReady && !this.props.debug) return null;

    const numIcons = Object.keys(this.state).length - 2;
    const startAngle = isReady ? (-45 * Math.PI / 180) : 0;
    const stepAngle = isReady ? (8 * Math.PI / 180) : (2 * Math.PI / numIcons);
    return Object.keys(this.state).filter((key) => key !== 'ready').map((key, idx) => {
      const angle = startAngle + idx * stepAngle;
      const radius = isReady ? 10 : 70;
      const offset = isReady ? (2 * radius) : (-2 * radius);
      const xpos = Math.cos(angle)*(350 + offset);
      const ypos = Math.sin(angle)*(350 + offset);
      return <g key={key} className={`${this.state[key]}-status`} transform={`translate(${xpos}, ${ypos})`}>
        <circle r={radius} strokeWidth={2}/>
        <text x="0" y="0" fontSize={radius} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{symbolMap[key]}</text>
      </g>;
    });
  }

  renderSculptureId(isReady) {
    if (isReady && !this.props.debug) return null;

    let transform = '';
    let fontSize = 30;
    if (isReady) {
      transform = `translate(400, 0) rotate(90)`;
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
      <g style={{transform: "translate(350px, 350px)"}}>
        <g className="" style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale})`}}>
          {this.renderIcons(this.state.ready)}
          {this.renderSculptureId(this.state.ready)}
          {this.renderVersion(this.state.ready)}
        </g>
      </g>
    </svg>;
  }
}
