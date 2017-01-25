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
    center: React.PropTypes.bool,
  }

  static defaultProps = {
    center: true,
  }

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
      const xpos = Math.cos(angle)*20;
      const ypos = Math.sin(angle)*20;
      return <g key={key} className={`${this.state[key]}-status`} transform={`translate(${xpos}, ${ypos})`}>
            <circle r="10"/>
                     <text x="0" y="0" fontSize="10" textAnchor="middle" alignmentBaseline="middle">{symbolMap[key]}</text>
        </g>;
    });
  }

  render() {
    if (this.state.ready) return null;

    return <svg id="status-view" viewBox="-50 -50 100 100" style={{
      backgroundColor: "transparent",
      position: "absolute",
      width: "100%",
      height: "100%",
      right: 0,
      top: 0,
      zIndex: 10,
    }}>
      {this.renderIcons()}
    </svg>;
  }
}
