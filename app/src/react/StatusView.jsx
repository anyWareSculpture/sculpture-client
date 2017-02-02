import React from 'react';
import SculptureApp from '../app';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;
import config from '../config';
import InitStore from '../init-store';
import {initStore} from '../stores';

const symbolMap = {
  STRIP_A: 'A',
  STRIP_B: 'B',
  STRIP_C: 'C',
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

  renderIcons() {
    const numIcons = Object.keys(this.state).length - 1;
    return Object.keys(this.state).filter((key) => key !== 'ready').map((key, idx) => {
      const angle = idx * 2*Math.PI / numIcons;
      const radius = 70;
      const xpos = Math.cos(angle)*(350 - 2*radius);
      const ypos = Math.sin(angle)*(350 - 2*radius);
      return <g key={key} className={`${this.state[key]}-status`} transform={`translate(${xpos}, ${ypos})`}>
        <circle r={radius} strokeWidth={2}/>
        <text x="0" y="0" fontSize={radius} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{symbolMap[key]}</text>
      </g>;
    });
  }

  render() {
    if (this.state.ready) return null;

    return <svg id="status-view" viewBox="0 0 700 700" style={{
      position: "relative",
      width: "100%",
      height: "100%",
      right: 0,
      top: 0,
    }}>
      <g style={{transform: "translate(350px, 350px)"}}>
        <g className="" style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale})`}}>
          {this.renderIcons()}
        </g>
      </g>
    </svg>;
  }
}
