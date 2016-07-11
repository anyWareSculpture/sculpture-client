import 'babel-polyfill';

import Config from './config';
import SculptureApp from './app';
import * as SerialProtocol from './serial/serial-protocol';
const {SerialProtocolCommandBuilder} = SerialProtocol;

const config = new Config();
// TODO: Don't expose this
window.app = new SculptureApp(config);

function buildRequiredCommands() {
  const commands = [];
  // All required panels
  for (let lightId of Object.keys(config.LIGHTS)) {
    const stripId = config.LIGHTS[lightId];
    commands.push({name: lightId,
                   cmd: SerialProtocolCommandBuilder.build(SerialProtocol.PANEL_SET_COMMAND, {stripId})});
  }
  commands.push({name: 'Disk Reset',
                 cmd: SerialProtocolCommandBuilder.build(SerialProtocol.DISK_RESET_COMMAND, {})});
  commands.push({name: 'Handshake',
                 cmd: SerialProtocolCommandBuilder.build(SerialProtocol.HANDSHAKE_COMMAND, {})});
  return commands;
}

window.app.on(SculptureApp.EVENT_SERIAL_INITIALIZED, (serialManager) => {
  const commands = buildRequiredCommands();
  const table = document.getElementById('serial-status');
  for (let cmdobj of commands) {
    const ports = serialManager.findTargetPorts(cmdobj.cmd);
    console.debug(`${cmdobj.name} ${ports.size === 0 ? 'Not' : ''} OK`);
    const cell = table.insertRow(-1).insertCell(0);
    cell.innerHTML = `${cmdobj.name} ${ports.size === 0 ? 'Not' : ''} OK`;
  }
});

window.app.on(SculptureApp.EVENT_CLIENT_CONNECTED, (connected) => {
  const clientSpan = document.getElementById('client-status');
  clientSpan.innerHTML = `${connected ? '' : 'Not '} connected`;
});

window.onload = function() {
  const manifest = chrome.runtime.getManifest();
  console.log(`Version: ${manifest.version}`);
  console.debug(document);
  const v = document.getElementById('anyware-version');
  v.innerHTML = manifest.version;

  const restart = document.getElementById('restart');
  restart.addEventListener('click', function() {
    chrome.runtime.reload();
  });
};


const connectionOptions = Object.assign({}, config.CLIENT_CONNECTION_OPTIONS.default);

if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

app.connectAndSetup(connectionOptions);

