import React from 'react';
import SculptureApp from '../app';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;
import Config from '../config';

const config = new Config();

const symbolMap = {
  STRIP_A: 'A',
  STRIP_B: 'B',
  STRIP_C: 'C',
  HANDSHAKE_STRIP: 'H',
  ART_LIGHTS_STRIP: 'P',
  Handshake: 'V',
  connected: 'N',
};

function buildRequiredCommands() {
  const commands = {};
  // All required panels
  for (const lightId of Object.keys(config.LIGHTS)) {
    const stripId = config.LIGHTS[lightId];
    commands[lightId] = SerialProtocolCommandBuilder.build(SerialProtocol.PANEL_SET_COMMAND, {stripId});
  }
  commands['Handshake'] = SerialProtocolCommandBuilder.build(SerialProtocol.HANDSHAKE_COMMAND, {});
  return commands;
}

export default class StatusView extends React.Component {
  static propTypes = {
    center: React.PropTypes.bool,
  }

  static defaultProps = {
    center: true,
  }

  constructor(props) {
    super(props);
    const buildstate = { connected: 'yellow' };
    Object.keys(buildRequiredCommands()).forEach((name) => buildstate[name] = 'yellow');
    this.state = buildstate;
  }

  updateSerialStatuses(serialManager) {
    const commands = buildRequiredCommands();
    Object.keys(commands).forEach((name) => {
      const ports = serialManager.findTargetPorts(commands[name]);
      this.setState({[name]: ports.size === 0 ? 'red' : 'green'});
    });
  }

  updateNetworkStatus(connected) {
    this.setState({connected: connected ? 'green' : 'red'});
  }

  componentWillMount() {
    this.props.app.on(SculptureApp.EVENT_SERIAL_INITIALIZED, this.updateSerialStatuses.bind(this));
    this.props.app.on(SculptureApp.EVENT_CLIENT_CONNECTED, this.updateNetworkStatus.bind(this));
  }

  componentWillUnmount() {
    // FIXME: this.props.app.removeListener() ?
  }

  renderIcons() {
    const numIcons = Object.keys(this.state).length;
    return Object.keys(this.state).map((key, idx) => {
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
    return this.props.center && <svg id="status-view" viewBox="-50 -50 100 100" style={{
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
