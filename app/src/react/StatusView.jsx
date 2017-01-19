import React from 'react';
import SculptureApp from '../app';
import * as SerialProtocol from '../serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;
import Config from '../config';

const config = new Config();

function buildRequiredCommands() {
  const commands = {};
  // All required panels
  for (const lightId of Object.keys(config.LIGHTS)) {
    const stripId = config.LIGHTS[lightId];
    commands[lightId] = SerialProtocolCommandBuilder.build(SerialProtocol.PANEL_SET_COMMAND, {stripId});
  }
  commands['Disk Reset'] = SerialProtocolCommandBuilder.build(SerialProtocol.DISK_RESET_COMMAND, {});
  commands['Handshake'] = SerialProtocolCommandBuilder.build(SerialProtocol.HANDSHAKE_COMMAND, {});
  return commands;
}

export default class StatusView extends React.Component {
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
    this.setState({connected});
  }

  componentWillMount() {
    this.props.app.on(SculptureApp.EVENT_SERIAL_INITIALIZED, this.updateSerialStatuses.bind(this));
    this.props.app.on(SculptureApp.EVENT_CLIENT_CONNECTED, this.updateNetworkStatus.bind(this));
  }

  componentWillUnmount() {
    // FIXME: this.props.app.removeListener() ?
  }

  render() {
   return <svg id="status-view" style={{
     backgroundColor: "transparent",
     position: "absolute",
     width: 400,
     height: 50,
     right: 0,
     top: 0,
   }}>
      {Object.keys(this.state).map((key, idx) => <circle key={key} className={`${this.state[key]}-circle`} cx={25+idx*50} cy="25" r="20"/>)}
    </svg>;
  }
}
